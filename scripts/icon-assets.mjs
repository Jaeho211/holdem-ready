import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const ICONS_DIR = path.resolve("public/icons");
export const ICON_SOURCE_DIR = path.join(ICONS_DIR, "source");
export const ICON_PREVIEW_DIR = path.resolve(".release-artifacts/icon-previews");
export const APP_ICON_SVG_PATH = path.join(ICONS_DIR, "icon.svg");
export const APP_ICON_MASKABLE_SVG_PATH = path.join(ICONS_DIR, "icon-maskable.svg");

export const ICON_PREVIEW_SIZES = [16, 32, 48, 192, 512];

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const inlineSvgImages = async ({ svg, inputPath }) => {
  let output = svg;
  const matches = Array.from(svg.matchAll(/<image\b[^>]+(?:href|xlink:href)="([^"]+)"/g));

  for (const [, rawHref] of matches) {
    if (
      rawHref.startsWith("#") ||
      rawHref.startsWith("data:") ||
      rawHref.startsWith("http:") ||
      rawHref.startsWith("https:")
    ) {
      continue;
    }

    const resolvedPath = rawHref.startsWith("file:")
      ? new URL(rawHref)
      : path.resolve(path.dirname(inputPath), rawHref);
    const extension = path
      .extname(resolvedPath instanceof URL ? resolvedPath.pathname : resolvedPath)
      .toLowerCase();
    const mimeType = MIME_TYPES[extension];

    if (!mimeType) {
      continue;
    }

    const buffer = await readFile(resolvedPath);
    const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
    const hrefPattern = new RegExp(
      `((?:href|xlink:href)=\")${escapeRegExp(rawHref)}(\")`,
      "g",
    );

    output = output.replace(hrefPattern, `$1${dataUrl}$2`);
  }

  return output;
};

const waitForPageAssets = async (page) => {
  await page.evaluate(async () => {
    const htmlImagePromises = Array.from(document.images, (image) => {
      if (image.complete) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", () => reject(new Error(`Failed to load image: ${image.currentSrc || image.src}`)), {
          once: true,
        });
      });
    });

    const svgImagePromises = Array.from(document.querySelectorAll("image"), (image) => {
      const href =
        image.getAttribute("href") || image.getAttributeNS("http://www.w3.org/1999/xlink", "href");

      if (!href) {
        return Promise.resolve();
      }

      const resolvedHref = new URL(href, document.baseURI).href;

      return new Promise((resolve, reject) => {
        const preloader = new Image();
        preloader.addEventListener("load", resolve, { once: true });
        preloader.addEventListener("error", () => reject(new Error(`Failed to load SVG image: ${resolvedHref}`)), {
          once: true,
        });
        preloader.src = resolvedHref;
      });
    });

    if ("fonts" in document) {
      await document.fonts.ready;
    }

    await Promise.all([...htmlImagePromises, ...svgImagePromises]);
  });
};

const renderSvgBuffer = async ({
  browser,
  inputPath,
  width,
  height,
}) => {
  const svg = await inlineSvgImages({
    svg: await readFile(inputPath, "utf8"),
    inputPath,
  });
  const baseHref = pathToFileURL(`${path.dirname(inputPath)}${path.sep}`).href;
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });

  try {
    await page.setContent(
      `<html><head><base href="${baseHref}" /></head><body style="margin:0;background:transparent;overflow:hidden">${svg}</body></html>`,
      { waitUntil: "load" },
    );
    await waitForPageAssets(page);
    const buffer = await page.screenshot({ omitBackground: true, type: "png" });
    return buffer;
  } finally {
    await page.close();
  }
};

export const writeSvgPng = async ({
  browser,
  inputPath,
  outputPath,
  width,
  height,
}) => {
  const buffer = await renderSvgBuffer({
    browser,
    inputPath,
    width,
    height,
  });
  await writeFile(outputPath, buffer);
  return outputPath;
};

const previewHtml = (sources) => {
  const selectedSource = sources.find((source) => source.selected);

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>Icon Previews</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: "Noto Sans KR", system-ui, sans-serif;
        background: #041711;
        color: #f6efe0;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 32px;
        background:
          radial-gradient(circle at top, rgba(38, 110, 84, 0.35), transparent 28%),
          linear-gradient(180deg, #0b2a21 0%, #041711 62%);
      }

      h1 {
        margin: 0 0 8px;
        font-size: 28px;
      }

      p {
        margin: 0 0 24px;
        color: rgba(246, 239, 224, 0.72);
      }

      .grid {
        display: grid;
        gap: 16px;
      }

      .card {
        padding: 20px;
        border-radius: 24px;
        background: rgba(8, 34, 26, 0.82);
        border: 1px solid rgba(215, 185, 119, 0.18);
      }

      .title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
      }

      .title h2 {
        margin: 0;
        font-size: 20px;
      }

      .badge {
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(215, 185, 119, 0.18);
        color: #f0d28f;
        font-size: 12px;
        font-weight: 700;
      }

      .sizes {
        display: flex;
        flex-wrap: wrap;
        gap: 18px;
      }

      .preview {
        min-width: 92px;
        text-align: center;
      }

      .preview img {
        display: block;
        margin: 0 auto 8px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.04);
        box-shadow: 0 14px 34px rgba(0, 0, 0, 0.28);
      }

      .preview strong {
        display: block;
        font-size: 12px;
        color: rgba(246, 239, 224, 0.72);
      }
    </style>
  </head>
  <body>
    <h1>Icon Previews</h1>
    <p>16 / 32 / 48 / 192 / 512 크기 미리보기. 기준안: ${selectedSource?.label ?? "None"}.</p>
    <section class="grid">
      ${sources
        .map((source) => {
          const previews = source.outputs
            .map(
              ({ size, relativePath }) => `
          <div class="preview">
            <img src="${relativePath}" alt="${source.label} ${size}px" width="${size >= 192 ? 96 : 64}" height="${size >= 192 ? 96 : 64}" />
            <strong>${size} px</strong>
          </div>`,
            )
            .join("");

          return `
        <article class="card">
          <div class="title">
            <h2>${source.label}</h2>
            ${source.selected ? '<span class="badge">selected</span>' : ""}
          </div>
          <div class="sizes">${previews}</div>
        </article>`;
        })
        .join("")}
    </section>
  </body>
</html>
`;
};

export const getIconPreviewSpecs = () => [
  {
    slug: "app-icon",
    label: "App Icon",
    inputPath: APP_ICON_SVG_PATH,
    selected: true,
  },
];

export const generateIconPreviews = async ({ browser }) => {
  await mkdir(ICON_PREVIEW_DIR, { recursive: true });

  const previewSources = [];

  for (const source of getIconPreviewSpecs()) {
    const previewDir = path.join(ICON_PREVIEW_DIR, source.slug);
    await mkdir(previewDir, { recursive: true });

    const outputs = [];

    for (const size of ICON_PREVIEW_SIZES) {
      const outputPath = path.join(previewDir, `${size}.png`);
      await writeSvgPng({
        browser,
        inputPath: source.inputPath,
        outputPath,
        width: size,
        height: size,
      });

      outputs.push({
        size,
        outputPath,
        relativePath: path.relative(ICON_PREVIEW_DIR, outputPath).replaceAll(path.sep, "/"),
      });
    }

    previewSources.push({
      ...source,
      outputs,
    });
  }

  await writeFile(path.join(ICON_PREVIEW_DIR, "index.html"), previewHtml(previewSources));
  return previewSources;
};

export const generateFinalIconAssets = async ({ browser }) => {
  await mkdir(ICONS_DIR, { recursive: true });

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
};
