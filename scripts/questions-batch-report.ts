import { writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildQuestionBatchReport,
  renderQuestionBatchReportMarkdown,
} from "../lib/holdem/question-batch-report";
import { validateQuestionBank } from "../lib/holdem/question-bank-validator";
import {
  ensureQuestionOutputDir,
  getCurrentQuestionAssembly,
  loadQuestionBankFromRef,
  parseBaseRefArg,
  resolveBaseRef,
} from "./question-pipeline-utils";

const main = async () => {
  const explicitBaseRef = parseBaseRefArg(process.argv.slice(2));
  const baseRef = resolveBaseRef(explicitBaseRef);
  const assembly = getCurrentQuestionAssembly();
  const validation = validateQuestionBank(assembly);
  const baseQuestionBank = await loadQuestionBankFromRef(baseRef);
  const report = buildQuestionBatchReport({
    baseRef,
    currentQuestionBank: assembly.questionBank,
    baseQuestionBank,
    validation,
  });

  const outputDir = await ensureQuestionOutputDir();
  const jsonPath = path.join(outputDir, "batch-report.json");
  const markdownPath = path.join(outputDir, "batch-report.md");

  await writeFile(jsonPath, JSON.stringify(report, null, 2));
  await writeFile(markdownPath, renderQuestionBatchReportMarkdown(report));

  console.log(`Question batch report written to ${path.relative(process.cwd(), jsonPath)}`);
  console.log(`Changed IDs: ${report.changedQuestionIds.length}`);
  console.log(`Warnings: ${report.validationWarnings.length}`);
  console.log(`Errors: ${report.validationErrors.length}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
