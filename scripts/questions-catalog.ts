import { writeFile } from "node:fs/promises";
import path from "node:path";
import { renderQuestionCatalogMarkdown } from "../lib/holdem/question-batch-report";
import { questionBank } from "../lib/training-data";

const main = async () => {
  const outputPath = path.resolve("docs/question-catalog.md");
  const markdown = renderQuestionCatalogMarkdown(questionBank);

  await writeFile(outputPath, markdown);
  console.log(`Question catalog written to ${path.relative(process.cwd(), outputPath)}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
