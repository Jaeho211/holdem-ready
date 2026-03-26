import { spawnSync } from "node:child_process";
import process from "node:process";

const parseBaseRef = (argv) => {
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--base") {
      return argv[index + 1] ?? null;
    }
  }

  return null;
};

const baseRef = parseBaseRef(process.argv.slice(2));

const run = (command, args) => {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run("npm", ["run", "lint"]);
run("npx", ["tsc", "--noEmit"]);
run("npm", ["run", "questions:validate"]);
run("npm", ["test"]);
run("npm", ["run", "questions:catalog"]);
run("npm", [
  "run",
  "questions:batch-report",
  "--",
  ...(baseRef ? ["--base", baseRef] : []),
]);
