import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";
import { ICON_PREVIEW_DIR, generateIconPreviews } from "./icon-assets.mjs";

const browser = await chromium.launch({ headless: true });

try {
  const previews = await generateIconPreviews({ browser });
  console.log(`Generated ${previews.length} icon preview set in ${path.relative(process.cwd(), ICON_PREVIEW_DIR)}`);
} finally {
  await browser.close();
}
