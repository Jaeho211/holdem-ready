import { writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import questionBatchReportModule from "../lib/holdem/question-batch-report.ts";
import questionPipelineUtilsModule from "./question-pipeline-utils.ts";
const {
  ensureQuestionOutputDir,
  getCurrentQuestionAssembly,
  loadQuestionBankFromRef,
  parseBaseRefArg,
  resolveBaseRef,
} = questionPipelineUtilsModule;
const { getChangedQuestionIds } = questionBatchReportModule;
import {
  buildQAUrl,
  DEFAULT_BASE_URL,
  EXISTING_DEV_BASE_URL,
  isServerAvailable,
  QA_ROUTE,
  SCREENSHOT_VIEWPORT,
  startDevServer,
  stopDevServer,
  waitForServer,
} from "./qa-ui-core.mjs";

const evaluateLayoutInPage = ({ scenarioId, viewportWidth, viewportHeight, viewportDevice }) => {
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

const explicitBaseRef = parseBaseRefArg(process.argv.slice(2));
const baseRef = resolveBaseRef(explicitBaseRef);
const assembly = getCurrentQuestionAssembly();
const baseQuestionBank = await loadQuestionBankFromRef(baseRef);
const { changedQuestionIds } = getChangedQuestionIds({
  currentQuestionBank: assembly.questionBank,
  baseQuestionBank,
});

const outputDir = await ensureQuestionOutputDir();
const reportPath = path.join(outputDir, "qa-report.json");

if (changedQuestionIds.length === 0) {
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        baseRef,
        generatedAt: new Date().toISOString(),
        results: [],
      },
      null,
      2,
    ),
  );
  console.log(`Question QA report written to ${path.relative(process.cwd(), reportPath)}`);
  console.log("Changed questions: 0");
  process.exit(0);
}

const targets = changedQuestionIds.flatMap((questionId) => [
  { questionId, mode: "quiz" },
  { questionId, mode: "feedback" },
]);

const explicitBaseUrl = process.env.QA_UI_BASE_URL || null;
const reuseExistingDevServer = explicitBaseUrl ? false : await isServerAvailable(EXISTING_DEV_BASE_URL);
const baseUrl = explicitBaseUrl || (reuseExistingDevServer ? EXISTING_DEV_BASE_URL : DEFAULT_BASE_URL);
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
    const results = [];

    for (const target of targets) {
      const page = await browser.newPage({
        viewport: {
          width: SCREENSHOT_VIEWPORT.width,
          height: SCREENSHOT_VIEWPORT.height,
        },
        deviceScaleFactor: 1,
      });

      try {
        await page.goto(
          buildQAUrl(baseUrl, {
            question: target.questionId,
            mode: target.mode,
            chrome: "0",
          }),
          {
            waitUntil: "networkidle",
          },
        );
        await page.waitForSelector('[data-qa-root="app"]');
        await page.evaluate(async () => {
          if ("fonts" in document) {
            await document.fonts.ready;
          }
        });

        const screenshotPath = path.join(
          outputDir,
          `${target.questionId}-${target.mode}-${SCREENSHOT_VIEWPORT.width}x${SCREENSHOT_VIEWPORT.height}.png`,
        );
        await page.screenshot({
          path: screenshotPath,
          fullPage: false,
        });

        const result = await page.evaluate(evaluateLayoutInPage, {
          scenarioId: `${target.questionId}-${target.mode}`,
          viewportWidth: SCREENSHOT_VIEWPORT.width,
          viewportHeight: SCREENSHOT_VIEWPORT.height,
          viewportDevice: SCREENSHOT_VIEWPORT.device,
        });

        results.push({
          ...result,
          questionId: target.questionId,
          mode: target.mode,
          screenshotPath: path.relative(process.cwd(), screenshotPath),
        });
      } finally {
        await page.close();
      }
    }

    await writeFile(
      reportPath,
      JSON.stringify(
        {
          baseRef,
          generatedAt: new Date().toISOString(),
          results,
        },
        null,
        2,
      ),
    );

    const failed = results.filter((result) => !result.pass);
    console.log(`Question QA report written to ${path.relative(process.cwd(), reportPath)}`);
    console.log(`Changed questions: ${changedQuestionIds.length}`);
    console.log(`Screens checked: ${results.length}`);
    console.log(`Failures: ${failed.length}`);

    if (failed.length) {
      for (const result of failed) {
        console.error(
          `${result.questionId}/${result.mode} failed: overflow=${result.horizontalOverflow}, clipped=${result.clippedElements.length}, overlaps=${result.overlaps.length}`,
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
