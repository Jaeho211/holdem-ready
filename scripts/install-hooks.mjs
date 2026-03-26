import { execFileSync } from "node:child_process";
import process from "node:process";

try {
  execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
} catch {
  process.exit(0);
}

execFileSync("git", ["config", "core.hooksPath", ".githooks"], {
  cwd: process.cwd(),
  stdio: "ignore",
});
