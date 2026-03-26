import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { questionBank } from "../lib/training-data";
import { oddsQuestions } from "../lib/training-data/questions/odds";
import { postflopQuestions } from "../lib/training-data/questions/postflop";
import { preflopQuestions } from "../lib/training-data/questions/preflop";
import type {
  HoldemQuestion,
  OddsQuestion,
  PostflopQuestion,
  PreflopQuestion,
} from "../lib/training-data";

export const QUESTION_BATCH_OUTPUT_DIR = path.resolve(".qa-artifacts/questions");

const SNAPSHOT_FILES = [
  "lib/training-data.ts",
  "lib/training-data/category-meta.ts",
  "lib/training-data/defaults.ts",
  "lib/training-data/live-tips.ts",
  "lib/training-data/question-bank.ts",
  "lib/training-data/question-tags.ts",
  "lib/training-data/types.ts",
  "lib/training-data/questions/preflop.ts",
  "lib/training-data/questions/postflop.ts",
  "lib/training-data/questions/odds.ts",
  "lib/holdem/cards.ts",
  "lib/holdem/outs.ts",
];

export type CurrentQuestionAssembly = {
  questionBank: HoldemQuestion[];
  preflopQuestions: PreflopQuestion[];
  postflopQuestions: PostflopQuestion[];
  oddsQuestions: OddsQuestion[];
};

export const getCurrentQuestionAssembly = (): CurrentQuestionAssembly => ({
  questionBank,
  preflopQuestions,
  postflopQuestions,
  oddsQuestions,
});

const execGit = (args: string[]) =>
  execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

const tryExecGit = (args: string[]) => {
  try {
    return execGit(args);
  } catch {
    return null;
  }
};

export const resolveBaseRef = (explicitBaseRef?: string | null) => {
  if (explicitBaseRef) {
    return explicitBaseRef;
  }

  const mergeBaseWithOriginMain = tryExecGit(["merge-base", "HEAD", "origin/main"]);
  if (mergeBaseWithOriginMain) {
    return mergeBaseWithOriginMain;
  }

  const mergeBaseWithMain = tryExecGit(["merge-base", "HEAD", "main"]);
  if (mergeBaseWithMain) {
    return mergeBaseWithMain;
  }

  const previousCommit = tryExecGit(["rev-parse", "HEAD~1"]);
  return previousCommit ?? "HEAD";
};

export const parseBaseRefArg = (argv: string[]) => {
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--base") {
      return argv[index + 1] ?? null;
    }
  }

  return null;
};

export const ensureQuestionOutputDir = async () => {
  await mkdir(QUESTION_BATCH_OUTPUT_DIR, { recursive: true });
  return QUESTION_BATCH_OUTPUT_DIR;
};

const writeSnapshotFile = async (baseRef: string, tempDir: string, relativePath: string) => {
  try {
    const contents = execGit(["show", `${baseRef}:${relativePath}`]);
    const outputPath = path.join(tempDir, relativePath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, contents);
  } catch {
    return;
  }
};

export const loadQuestionBankFromRef = async (baseRef: string) => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "holdem-ready-questions-"));

  for (const relativePath of SNAPSHOT_FILES) {
    await writeSnapshotFile(baseRef, tempDir, relativePath);
  }

  try {
    const modulePath = pathToFileURL(path.join(tempDir, "lib/training-data.ts")).href;
    const snapshotModule = await import(modulePath);
    return snapshotModule.questionBank as HoldemQuestion[];
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};
