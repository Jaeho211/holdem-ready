import { formatValidationIssue, validateQuestionBank } from "../lib/holdem/question-bank-validator";
import { getCurrentQuestionAssembly } from "./question-pipeline-utils";

const assembly = getCurrentQuestionAssembly();
const validation = validateQuestionBank(assembly);

console.log(`Validated ${validation.stats.total} questions.`);
console.log(
  `Difficulty: 기초 ${validation.stats.difficultyPercent.기초}% / 실전 ${validation.stats.difficultyPercent.실전}% / 응용 ${validation.stats.difficultyPercent.응용}%`,
);
console.log(`Warnings: ${validation.warnings.length}`);
console.log(`Errors: ${validation.errors.length}`);

for (const issue of [...validation.errors, ...validation.warnings]) {
  console.log(formatValidationIssue(issue));
}

if (validation.errors.length > 0) {
  process.exitCode = 1;
}
