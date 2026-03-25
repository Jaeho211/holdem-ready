import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";

const VIEWPORT_WIDTHS = [360, 390, 430];
const OUTPUT_DIR = path.resolve(".qa-artifacts/ui");
const DEFAULT_BASE_URL = "http://127.0.0.1:3301";
const EXISTING_DEV_BASE_URL = "http://127.0.0.1:3000";
const QA_ROUTE = "/qa/ui";
const WAIT_TIMEOUT_MS = 120_000;

const parseArgs = (argv) => {
  const parsed = {
    scenario: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === "--scenario") {
      parsed.scenario = argv[index + 1] ?? null;
      index += 1;
    }
  }

  return parsed;
};

const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const isServerAvailable = async (baseUrl) => {
  try {
    const response = await fetch(baseUrl, {
      redirect: "manual",
    });
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
};

const buildRouteUrl = (baseUrl, scenarioId, chrome = "0") => {
  const url = new URL(QA_ROUTE, baseUrl);
  url.searchParams.set("scenario", scenarioId);
  url.searchParams.set("chrome", chrome);
  return url.toString();
};

const toHostAndPort = (baseUrl) => {
  const parsed = new URL(baseUrl);
  return {
    host: parsed.hostname,
    port: parsed.port || (parsed.protocol === "https:" ? "443" : "80"),
  };
};

const startDevServer = async (baseUrl) => {
  const { host, port } = toHostAndPort(baseUrl);
  const nextBin = path.resolve("node_modules/next/dist/bin/next");
  const child = spawn(
    process.execPath,
    [nextBin, "dev", "--hostname", host, "--port", port],
    {
      env: {
        ...process.env,
        BROWSER: "none",
      },
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let logs = "";
  const appendLog = (chunk) => {
    const message = chunk.toString();
    logs += message;
    if (logs.length > 8_000) {
      logs = logs.slice(-8_000);
    }
  };

  child.stdout.on("data", appendLog);
  child.stderr.on("data", appendLog);

  return { child, getLogs: () => logs };
};

const stopDevServer = async (server) => {
  if (!server?.child || server.child.killed) {
    return;
  }

  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      server.child.kill("SIGKILL");
    }, 5_000);

    server.child.once("exit", () => {
      clearTimeout(timer);
      resolve(undefined);
    });

    server.child.kill("SIGTERM");
  });
};

const waitForServer = async (url, server) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < WAIT_TIMEOUT_MS) {
    if (server?.child.exitCode !== null && server?.child.exitCode !== undefined) {
      throw new Error(`Dev server exited early.\n${server.getLogs()}`);
    }

    try {
      const response = await fetch(url, {
        redirect: "manual",
      });

      if (response.ok) {
        return;
      }
    } catch {}

    await wait(1_000);
  }

  throw new Error(`Timed out waiting for ${url}`);
};

const getScenarioIds = async (page, baseUrl) => {
  await page.goto(new URL(QA_ROUTE, baseUrl).toString(), {
    waitUntil: "networkidle",
  });

  await page.waitForSelector("[data-qa-scenario-link]");

  return page.$$eval("[data-qa-scenario-link]", (elements) =>
    elements
      .map((element) => element.getAttribute("data-qa-scenario-link"))
      .filter(Boolean),
  );
};

const evaluateLayout = ({ scenarioId, viewportWidth }) => {
  const round = (value) => Math.round(value * 100) / 100;
  const isVisible = (element) => {
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }

    return Number.parseFloat(style.opacity || "1") > 0;
  };

  const intersectsViewport = (rect) =>
    rect.width > 0 &&
    rect.height > 0 &&
    rect.right > 0 &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.top < window.innerHeight;

  const rectData = (rect) => ({
    top: round(rect.top),
    right: round(rect.right),
    bottom: round(rect.bottom),
    left: round(rect.left),
    width: round(rect.width),
    height: round(rect.height),
  });

  const intersects = (first, second) =>
    first.left < second.right &&
    first.right > second.left &&
    first.top < second.bottom &&
    first.bottom > second.top;

  const rectGap = (first, second) => {
    if (intersects(first, second)) {
      return 0;
    }

    const dx = Math.max(first.left - second.right, second.left - first.right, 0);
    const dy = Math.max(first.top - second.bottom, second.top - first.bottom, 0);
    return Math.sqrt(dx ** 2 + dy ** 2);
  };

  const buildEntry = (element, kind) => {
    const value =
      element.getAttribute("data-qa-overlay") ??
      element.getAttribute("data-qa-region") ??
      element.getAttribute("data-qa-screen") ??
      kind;
    const rect = element.getBoundingClientRect();

    return {
      element,
      kind,
      value,
      rect,
      rectData: rectData(rect),
    };
  };

  const elements = Array.from(
    document.querySelectorAll("[data-qa-screen], [data-qa-region], [data-qa-overlay]"),
  )
    .filter((element) => !element.closest("[data-qa-ignore]"))
    .filter((element) => isVisible(element))
    .map((element) => {
      if (element.hasAttribute("data-qa-overlay")) {
        return buildEntry(element, "overlay");
      }
      if (element.hasAttribute("data-qa-region")) {
        return buildEntry(element, "region");
      }
      return buildEntry(element, "screen");
    })
    .filter((entry) => entry.rect.width > 0 && entry.rect.height > 0);

  const flowRegions = elements.filter(
    (entry) => entry.kind === "region" && !entry.value.startsWith("table-"),
  );
  const fixedOverlays = elements.filter(
    (entry) =>
      entry.kind === "overlay" &&
      (entry.value.startsWith("fixed-") ||
        entry.value.startsWith("modal-") ||
        entry.value.startsWith("sheet-")),
  );
  const tableMarkers = elements.filter(
    (entry) =>
      entry.value.startsWith("table-seat-chip:") ||
      entry.value.startsWith("table-action-badge:") ||
      entry.value.startsWith("table-spotlight:") ||
      entry.value === "table-dealer",
  );

  const clippedElements = [];
  const pushClip = (entry, axis) => {
    clippedElements.push({
      target: entry.value,
      kind: entry.kind,
      axis,
      rect: entry.rectData,
    });
  };

  for (const entry of elements) {
    if (entry.rect.left < -1 || entry.rect.right > window.innerWidth + 1) {
      pushClip(entry, "x");
    }
  }

  for (const entry of fixedOverlays) {
    if (entry.rect.top < -1 || entry.rect.bottom > window.innerHeight + 1) {
      pushClip(entry, "y");
    }
  }

  const overlaps = [];
  const gapValues = [];

  const comparePair = (first, second) => {
    if (first.element.contains(second.element) || second.element.contains(first.element)) {
      return;
    }

    if (!intersectsViewport(first.rect) && !intersectsViewport(second.rect)) {
      return;
    }

    const gap = rectGap(first.rect, second.rect);
    gapValues.push(gap);

    if (gap === 0) {
      overlaps.push({
        first: first.value,
        second: second.value,
        rects: {
          first: first.rectData,
          second: second.rectData,
        },
      });
    }
  };

  for (let index = 0; index < flowRegions.length; index += 1) {
    for (let cursor = index + 1; cursor < flowRegions.length; cursor += 1) {
      const first = flowRegions[index];
      const second = flowRegions[cursor];

      if (first.element.parentElement !== second.element.parentElement) {
        continue;
      }

      comparePair(first, second);
    }
  }

  for (let index = 0; index < tableMarkers.length; index += 1) {
    for (let cursor = index + 1; cursor < tableMarkers.length; cursor += 1) {
      comparePair(tableMarkers[index], tableMarkers[cursor]);
    }
  }

  const root = document.querySelector('[data-qa-root="app"]');
  const rootRect = root?.getBoundingClientRect();
  const horizontalOverflow =
    document.documentElement.scrollWidth - document.documentElement.clientWidth > 1 ||
    Boolean(rootRect && (rootRect.left < -1 || rootRect.right > window.innerWidth + 1));

  return {
    scenarioId,
    viewportWidth,
    pass: !horizontalOverflow && clippedElements.length === 0 && overlaps.length === 0,
    horizontalOverflow,
    clippedElements,
    overlaps,
    minGapPx: gapValues.length ? round(Math.min(...gapValues)) : null,
  };
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const explicitBaseUrl = process.env.QA_UI_BASE_URL || null;
  const reuseExistingDevServer = explicitBaseUrl ? false : await isServerAvailable(EXISTING_DEV_BASE_URL);
  const baseUrl = explicitBaseUrl || (reuseExistingDevServer ? EXISTING_DEV_BASE_URL : DEFAULT_BASE_URL);

  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  const server = explicitBaseUrl || reuseExistingDevServer ? null : await startDevServer(baseUrl);

  const cleanup = async () => {
    await stopDevServer(server);
  };

  process.on("SIGINT", async () => {
    await cleanup();
    process.exit(130);
  });

  process.on("SIGTERM", async () => {
    await cleanup();
    process.exit(143);
  });

  try {
    await waitForServer(new URL(QA_ROUTE, baseUrl).toString(), server);

    const browser = await chromium.launch({ headless: true });
    try {
      const manifestPage = await browser.newPage({
        viewport: {
          width: VIEWPORT_WIDTHS[0],
          height: 900,
        },
      });
      const scenarioIds = args.scenario ? [args.scenario] : await getScenarioIds(manifestPage, baseUrl);
      await manifestPage.close();

      if (!scenarioIds.length) {
        throw new Error("No QA scenarios were discovered.");
      }

      const results = [];

      for (const scenarioId of scenarioIds) {
        for (const viewportWidth of VIEWPORT_WIDTHS) {
          const page = await browser.newPage({
            viewport: {
              width: viewportWidth,
              height: 900,
            },
            deviceScaleFactor: 1,
          });

          try {
            await page.goto(buildRouteUrl(baseUrl, scenarioId), {
              waitUntil: "networkidle",
            });
            await page.waitForSelector('[data-qa-root="app"]');
            await page.evaluate(async () => {
              if ("fonts" in document) {
                await document.fonts.ready;
              }
            });

            const screenshotPath = path.join(OUTPUT_DIR, `${scenarioId}-${viewportWidth}.png`);
            await page.screenshot({
              path: screenshotPath,
              fullPage: false,
            });

            const result = await page.evaluate(evaluateLayout, {
              scenarioId,
              viewportWidth,
            });

            results.push({
              ...result,
              screenshotPath: path.relative(process.cwd(), screenshotPath),
            });
          } finally {
            await page.close();
          }
        }
      }

      const reportPath = path.join(OUTPUT_DIR, "report.json");
      await writeFile(
        reportPath,
        JSON.stringify(
          {
            baseUrl,
            generatedAt: new Date().toISOString(),
            results,
          },
          null,
          2,
        ),
      );

      const failed = results.filter((result) => !result.pass);
      console.log(`UI QA report written to ${path.relative(process.cwd(), reportPath)}`);
      console.log(`Scenarios: ${results.length}`);
      console.log(`Failures: ${failed.length}`);

      if (failed.length) {
        for (const result of failed) {
          console.error(
            `${result.scenarioId} @ ${result.viewportWidth}px failed: overflow=${result.horizontalOverflow}, clipped=${result.clippedElements.length}, overlaps=${result.overlaps.length}`,
          );
        }
        process.exitCode = 1;
      }
    } finally {
      await browser.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Executable doesn't exist")) {
      console.error(`${message}\nRun "npm run qa:ui:install" once to download Chromium.`);
    } else {
      console.error(message);
    }
    process.exitCode = 1;
  } finally {
    await cleanup();
  }
};

await main();
