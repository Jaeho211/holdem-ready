import { execFileSync, spawnSync } from "node:child_process";
import process from "node:process";

const RELEVANT_PATH_PATTERNS = [
  "lib/training-data",
  "lib/holdem/question-bank",
  "lib/holdem/question-batch-report",
  "lib/holdem/question-bank-validator",
  "lib/holdem/postflop-review",
  "app/_components/qa-ui",
  "app/qa/ui",
  "scripts/qa-",
  "scripts/question",
  "scripts/verify-content.mjs",
  "docs/question-pipeline.md",
  "docs/question-catalog.md",
  "docs/testing.md",
  "docs/skills/question-generator.md",
  ".github/workflows/content-quality.yml",
];

const ZERO_SHA = "0000000000000000000000000000000000000000";

const execGit = (args) =>
  execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

const stdin = await new Promise((resolve) => {
  let value = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    value += chunk;
  });
  process.stdin.on("end", () => resolve(value));
});

const refs = String(stdin)
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [localRef, localSha, remoteRef, remoteSha] = line.split(/\s+/);
    return { localRef, localSha, remoteRef, remoteSha };
  });

if (!refs.length) {
  process.exit(0);
}

const mainRef = (() => {
  try {
    return execGit(["rev-parse", "--verify", "main"]);
  } catch {
    return execGit(["rev-parse", "HEAD"]);
  }
})();

const changedFiles = new Set();

for (const ref of refs) {
  const baseSha = ref.remoteSha !== ZERO_SHA
    ? ref.remoteSha
    : execGit(["merge-base", ref.localSha, mainRef]);
  const diffOutput = execGit(["diff", "--name-only", `${baseSha}..${ref.localSha}`]);
  for (const file of diffOutput.split("\n").filter(Boolean)) {
    changedFiles.add(file);
  }
}

const shouldVerify = [...changedFiles].some((file) =>
  RELEVANT_PATH_PATTERNS.some((pattern) => file.startsWith(pattern)),
);

if (!shouldVerify) {
  process.exit(0);
}

const result = spawnSync("npm", ["run", "verify:content"], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const catalogDiff = spawnSync("git", ["diff", "--quiet", "--", "docs/question-catalog.md"], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: process.env,
});

if (catalogDiff.status !== 0) {
  console.error("docs/question-catalog.md is out of date. Run `npm run questions:catalog` and commit the result.");
  process.exit(catalogDiff.status ?? 1);
}
