import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";
import {
  buildQAUrl,
  DEFAULT_BASE_URL,
  EXISTING_DEV_BASE_URL,
  QA_ROUTE,
  isServerAvailable,
  startDevServer,
  stopDevServer,
  waitForServer,
} from "./qa-ui-core.mjs";

const OUTPUT_DIR = path.resolve(".release-artifacts/play-store");
const ICONS_DIR = path.resolve("public/icons");
const FEATURE_SVG_PATH = path.resolve("public/play-store-feature.svg");
const APP_ICON_SVG_PATH = path.resolve("public/icon.svg");
const APP_ICON_MASKABLE_SVG_PATH = path.resolve("public/icon-maskable.svg");
const SCREENSHOT_VIEWPORT = {
  width: 412,
  height: 915,
  scale: 3,
};

const screenshots = [
  { scenario: "home-progress", output: "phone-home-progress.png" },
  { scenario: "wrongs-list", output: "phone-wrongs-list.png" },
  { scenario: "records-populated", output: "phone-records-populated.png" },
  { scenario: "quiz-postflop", output: "phone-quiz-postflop.png" },
  { scenario: "settings-modal", output: "phone-settings-modal.png" },
];

const waitForFonts = async (page) => {
  await page.evaluate(async () => {
    if ("fonts" in document) {
      await document.fonts.ready;
    }
  });
};

const writeSvgPng = async ({
  browser,
  inputPath,
  outputPath,
  width,
  height,
}) => {
  const svg = await readFile(inputPath, "utf8");
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });

  try {
    await page.setContent(
      `<html><body style="margin:0;background:transparent;overflow:hidden">${svg}</body></html>`,
      { waitUntil: "load" },
    );
    await waitForFonts(page);
    await page.screenshot({ path: outputPath, omitBackground: true });
  } finally {
    await page.close();
  }
};

const captureScenario = async ({ browser, baseUrl, scenario, outputPath }) => {
  const page = await browser.newPage({
    viewport: {
      width: SCREENSHOT_VIEWPORT.width,
      height: SCREENSHOT_VIEWPORT.height,
    },
    deviceScaleFactor: SCREENSHOT_VIEWPORT.scale,
  });

  try {
    await page.goto(
      buildQAUrl(baseUrl, {
        scenario,
        chrome: "0",
      }),
      {
        waitUntil: "networkidle",
      },
    );
    await page.waitForSelector('[data-qa-root="app"]');
    await waitForFonts(page);
    await page.screenshot({ path: outputPath, fullPage: false });
  } finally {
    await page.close();
  }
};

await rm(OUTPUT_DIR, { recursive: true, force: true });
await mkdir(OUTPUT_DIR, { recursive: true });
await mkdir(ICONS_DIR, { recursive: true });

const explicitBaseUrl = process.env.QA_UI_BASE_URL || null;
const reuseExistingDevServer = explicitBaseUrl ? false : await isServerAvailable(EXISTING_DEV_BASE_URL);
const baseUrl = explicitBaseUrl || (reuseExistingDevServer ? EXISTING_DEV_BASE_URL : DEFAULT_BASE_URL);
const server = explicitBaseUrl || reuseExistingDevServer ? null : await startDevServer(baseUrl);

try {
  await waitForServer(new URL(QA_ROUTE, baseUrl).toString(), server);

  const browser = await chromium.launch({ headless: true });
  try {
    await writeSvgPng({
      browser,
      inputPath: APP_ICON_SVG_PATH,
      outputPath: path.join(ICONS_DIR, "icon-192.png"),
      width: 192,
      height: 192,
    });
    await writeSvgPng({
      browser,
      inputPath: APP_ICON_SVG_PATH,
      outputPath: path.join(ICONS_DIR, "icon-512.png"),
      width: 512,
      height: 512,
    });
    await writeSvgPng({
      browser,
      inputPath: APP_ICON_MASKABLE_SVG_PATH,
      outputPath: path.join(ICONS_DIR, "icon-maskable-192.png"),
      width: 192,
      height: 192,
    });
    await writeSvgPng({
      browser,
      inputPath: APP_ICON_MASKABLE_SVG_PATH,
      outputPath: path.join(ICONS_DIR, "icon-maskable-512.png"),
      width: 512,
      height: 512,
    });

    await writeSvgPng({
      browser,
      inputPath: FEATURE_SVG_PATH,
      outputPath: path.join(OUTPUT_DIR, "feature-graphic-1024x500.png"),
      width: 1024,
      height: 500,
    });

    for (const screenshot of screenshots) {
      await captureScenario({
        browser,
        baseUrl,
        scenario: screenshot.scenario,
        outputPath: path.join(OUTPUT_DIR, screenshot.output),
      });
    }
  } finally {
    await browser.close();
  }
} finally {
  await stopDevServer(server);
}

console.log(`Generated public icons in ${path.relative(process.cwd(), ICONS_DIR)}`);
console.log(`Generated release assets in ${path.relative(process.cwd(), OUTPUT_DIR)}`);
