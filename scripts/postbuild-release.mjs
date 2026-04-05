import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const OUT_DIR = path.resolve("out");
const QA_OUTPUT_DIR = path.join(OUT_DIR, "qa");
const WELL_KNOWN_DIR = path.join(OUT_DIR, ".well-known");
const androidPackageName = process.env.ANDROID_PACKAGE_NAME ?? "com.jaeho211.holdemready";
const androidCertFingerprints = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const redirects = [
  "/privacy /privacy.html 200",
  "/support /support.html 200",
  "/qa/* /404.html 404",
];

const assetlinks =
  androidCertFingerprints.length === 0
    ? []
    : [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: androidPackageName,
            sha256_cert_fingerprints: androidCertFingerprints,
          },
        },
      ];

await rm(QA_OUTPUT_DIR, { recursive: true, force: true });
await mkdir(WELL_KNOWN_DIR, { recursive: true });

await writeFile(path.join(OUT_DIR, "_redirects"), `${redirects.join("\n")}\n`);
await writeFile(
  path.join(WELL_KNOWN_DIR, "assetlinks.json"),
  `${JSON.stringify(assetlinks, null, 2)}\n`,
);

console.log(`Prepared Netlify release output in ${path.relative(process.cwd(), OUT_DIR)}`);
