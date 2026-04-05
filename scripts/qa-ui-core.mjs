import { spawn } from "node:child_process";
import process from "node:process";

export const SCREENSHOT_VIEWPORTS = [
  {
    id: "small-phone",
    width: 360,
    height: 780,
    device: "pixel-5",
  },
  {
    id: "large-phone",
    width: 412,
    height: 915,
    device: "pixel-8-pro",
  },
  {
    id: "tablet-portrait",
    width: 800,
    height: 1280,
    device: "pixel-tablet",
  },
];
export const SCREENSHOT_VIEWPORT = SCREENSHOT_VIEWPORTS[0];

export const DEFAULT_BASE_URL = "http://127.0.0.1:3301";
export const EXISTING_DEV_BASE_URL = "http://127.0.0.1:3000";
export const QA_ROUTE = "/qa/ui";
export const WAIT_TIMEOUT_MS = 120_000;

export const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export const isServerAvailable = async (baseUrl) => {
  try {
    const response = await fetch(baseUrl, {
      redirect: "manual",
    });
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
};

export const buildQAUrl = (baseUrl, params = {}) => {
  const url = new URL(QA_ROUTE, baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
};

const toHostAndPort = (baseUrl) => {
  const parsed = new URL(baseUrl);
  return {
    host: parsed.hostname,
    port: parsed.port || (parsed.protocol === "https:" ? "443" : "80"),
  };
};

export const startDevServer = async (baseUrl) => {
  const { host, port } = toHostAndPort(baseUrl);
  const nextBin = "node_modules/next/dist/bin/next";
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

export const stopDevServer = async (server) => {
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

export const waitForServer = async (url, server) => {
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

export const evaluateLayout = ({ scenarioId, viewportWidth, viewportHeight, viewportDevice }) => {
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
    if (entry.value === "sheet-feedback") {
      continue;
    }

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

  const root = document.querySelector('[data-qa-root="app"]');
  const rootRect = root?.getBoundingClientRect();
  const horizontalOverflow =
    document.documentElement.scrollWidth - document.documentElement.clientWidth > 1 ||
    Boolean(rootRect && (rootRect.left < -1 || rootRect.right > window.innerWidth + 1));

  return {
    scenarioId,
    viewportWidth,
    viewportHeight,
    viewportDevice,
    pass: !horizontalOverflow && clippedElements.length === 0 && overlaps.length === 0,
    horizontalOverflow,
    clippedElements,
    overlaps,
    minGapPx: gapValues.length ? round(Math.min(...gapValues)) : null,
  };
};

const EVALUATE_LAYOUT_SOURCE = `(${evaluateLayout.toString()})`;

export const installLayoutEvaluator = async (page) => {
  await page.addInitScript({
    content: `window.__qaEvaluateLayout = ${EVALUATE_LAYOUT_SOURCE};`,
  });
};

export const runEvaluateLayout = async (page, args) =>
  page.evaluate((payload) => window.__qaEvaluateLayout(payload), args);
