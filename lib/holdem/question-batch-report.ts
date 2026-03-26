import type { HoldemQuestion, TrainingCategory } from "../training-data";
import type {
  QuestionBankValidationResult,
  QuestionValidationIssue,
} from "./question-bank-validator";
import { getQuestionCatalogSignature } from "./question-bank-validator";

export type QuestionCatalogEntry = {
  id: string;
  category: TrainingCategory;
  difficulty: HoldemQuestion["difficulty"];
  signature: string;
  tags: string[];
  correct: string;
};

export type QuestionBatchReport = {
  baseRef: string;
  changedQuestionIds: string[];
  removedQuestionIds: string[];
  changedCountsByCategory: Record<TrainingCategory, number>;
  exactDuplicates: string[][];
  nearDuplicates: Array<{
    questionIds: string[];
    differingFields?: string[];
  }>;
  newTags: string[];
  wholeBankDifficultyPercent: Record<HoldemQuestion["difficulty"], number>;
  batchDifficultyPercent: Record<HoldemQuestion["difficulty"], number>;
  validationErrors: string[];
  validationWarnings: string[];
  requiredSampleReviewIds: string[];
};

const CATEGORY_KEYS = ["preflop", "postflop", "odds"] as const;
const DIFFICULTY_KEYS = ["기초", "실전", "응용"] as const;

const toQuestionMap = (questionBank: readonly HoldemQuestion[]) =>
  new Map(questionBank.map((question) => [question.id, question]));

const countDifficultyPercent = (questionBank: readonly HoldemQuestion[]) => {
  const counts = {
    기초: 0,
    실전: 0,
    응용: 0,
  };

  for (const question of questionBank) {
    counts[question.difficulty] += 1;
  }

  return Object.fromEntries(
    DIFFICULTY_KEYS.map((difficulty) => [
      difficulty,
      questionBank.length
        ? Math.round((counts[difficulty] / questionBank.length) * 10000) / 100
        : 0,
    ]),
  ) as Record<HoldemQuestion["difficulty"], number>;
};

const normalizeQuestion = (question: HoldemQuestion) => JSON.stringify(question);

export const getChangedQuestionIds = ({
  currentQuestionBank,
  baseQuestionBank,
}: {
  currentQuestionBank: readonly HoldemQuestion[];
  baseQuestionBank: readonly HoldemQuestion[];
}) => {
  const currentMap = toQuestionMap(currentQuestionBank);
  const baseMap = toQuestionMap(baseQuestionBank);
  const changedQuestionIds = [...currentMap.keys()]
    .filter((questionId) => {
      const current = currentMap.get(questionId);
      const base = baseMap.get(questionId);
      return !base || normalizeQuestion(current!) !== normalizeQuestion(base);
    })
    .sort();
  const removedQuestionIds = [...baseMap.keys()]
    .filter((questionId) => !currentMap.has(questionId))
    .sort();

  return {
    changedQuestionIds,
    removedQuestionIds,
  };
};

const getChangedIssueMessages = (
  issues: readonly QuestionValidationIssue[],
  changedQuestionIds: readonly string[],
) =>
  issues
    .filter((issue) => issue.questionId && changedQuestionIds.includes(issue.questionId))
    .map((issue) => {
      const related = issue.relatedQuestionIds?.length
        ? ` [${issue.relatedQuestionIds.join(", ")}]`
        : "";
      return `${issue.questionId}${issue.field ? `/${issue.field}` : ""}: ${issue.message}${related}`;
    })
    .sort();

export const selectSampleReviewIds = ({
  changedQuestionIds,
  validation,
  currentQuestionBank,
}: {
  changedQuestionIds: readonly string[];
  validation: QuestionBankValidationResult;
  currentQuestionBank: readonly HoldemQuestion[];
}) => {
  if (changedQuestionIds.length <= 12) {
    return [...changedQuestionIds].sort();
  }

  const issueIds = new Set(
    [...validation.errors, ...validation.warnings]
      .map((issue) => issue.questionId)
      .filter((questionId): questionId is string => Boolean(questionId))
      .filter((questionId) => changedQuestionIds.includes(questionId)),
  );
  const sample = new Set<string>(issueIds);
  const currentMap = toQuestionMap(currentQuestionBank);

  for (const category of CATEGORY_KEYS) {
    const cleanIds = [...changedQuestionIds]
      .filter((questionId) => currentMap.get(questionId)?.category === category)
      .filter((questionId) => !issueIds.has(questionId))
      .sort();

    if (!cleanIds.length) {
      continue;
    }

    const sampleCount = Math.min(5, Math.max(1, Math.ceil(cleanIds.length * 0.15)));
    for (const questionId of cleanIds.slice(0, sampleCount)) {
      sample.add(questionId);
    }
  }

  return [...sample].sort();
};

export const buildQuestionBatchReport = ({
  baseRef,
  currentQuestionBank,
  baseQuestionBank,
  validation,
}: {
  baseRef: string;
  currentQuestionBank: readonly HoldemQuestion[];
  baseQuestionBank: readonly HoldemQuestion[];
  validation: QuestionBankValidationResult;
}): QuestionBatchReport => {
  const { changedQuestionIds, removedQuestionIds } = getChangedQuestionIds({
    currentQuestionBank,
    baseQuestionBank,
  });
  const currentMap = toQuestionMap(currentQuestionBank);
  const baseTagSet = new Set(baseQuestionBank.flatMap((question) => question.tags));
  const changedQuestions = changedQuestionIds
    .map((questionId) => currentMap.get(questionId))
    .filter((question): question is HoldemQuestion => Boolean(question));
  const changedCountsByCategory = {
    preflop: 0,
    postflop: 0,
    odds: 0,
  };

  for (const question of changedQuestions) {
    changedCountsByCategory[question.category] += 1;
  }

  const exactDuplicates = validation.exactDuplicateGroups
    .filter((group) => group.questionIds.some((questionId) => changedQuestionIds.includes(questionId)))
    .map((group) => group.questionIds);
  const nearDuplicates = validation.nearDuplicateGroups
    .filter((group) => group.questionIds.some((questionId) => changedQuestionIds.includes(questionId)))
    .map((group) => ({
      questionIds: group.questionIds,
      differingFields: group.differingFields,
    }));
  const newTags = [...new Set(
    changedQuestions
      .flatMap((question) => question.tags)
      .filter((tag) => !baseTagSet.has(tag)),
  )].sort();

  return {
    baseRef,
    changedQuestionIds,
    removedQuestionIds,
    changedCountsByCategory,
    exactDuplicates,
    nearDuplicates,
    newTags,
    wholeBankDifficultyPercent: validation.stats.difficultyPercent,
    batchDifficultyPercent: countDifficultyPercent(changedQuestions),
    validationErrors: getChangedIssueMessages(validation.errors, changedQuestionIds),
    validationWarnings: getChangedIssueMessages(validation.warnings, changedQuestionIds),
    requiredSampleReviewIds: selectSampleReviewIds({
      changedQuestionIds,
      validation,
      currentQuestionBank,
    }),
  };
};

export const getQuestionCatalogEntries = (
  questionBank: readonly HoldemQuestion[],
): QuestionCatalogEntry[] =>
  questionBank.map((question) => ({
    id: question.id,
    category: question.category,
    difficulty: question.difficulty,
    signature: getQuestionCatalogSignature(question),
    tags: [...question.tags],
    correct: String(question.correct),
  }));

export const renderQuestionCatalogMarkdown = (
  questionBank: readonly HoldemQuestion[],
) => {
  const entries = getQuestionCatalogEntries(questionBank);
  const byCategory = Object.fromEntries(
    CATEGORY_KEYS.map((category) => [
      category,
      entries.filter((entry) => entry.category === category),
    ]),
  ) as Record<TrainingCategory, QuestionCatalogEntry[]>;

  const lines = [
    "# Question Catalog",
    "",
    "이 문서는 `npm run questions:catalog`로 생성됩니다.",
    "",
    "## Totals",
    "",
    `- 전체: ${entries.length}`,
    ...CATEGORY_KEYS.map((category) => `- ${category}: ${byCategory[category].length}`),
    "",
  ];

  for (const category of CATEGORY_KEYS) {
    lines.push(`## ${category}`);
    lines.push("");
    lines.push("| ID | Difficulty | Signature | Tags | Correct |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const entry of byCategory[category]) {
      lines.push(
        `| ${entry.id} | ${entry.difficulty} | ${entry.signature} | ${entry.tags.join(", ")} | ${entry.correct} |`,
      );
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
};

export const renderQuestionBatchReportMarkdown = (report: QuestionBatchReport) => {
  const lines = [
    "# Question Batch Report",
    "",
    `- Base ref: \`${report.baseRef}\``,
    `- Changed IDs: ${report.changedQuestionIds.length}`,
    `- Removed IDs: ${report.removedQuestionIds.length}`,
    "",
    "## Changed Question IDs",
    "",
    ...(report.changedQuestionIds.length
      ? report.changedQuestionIds.map((questionId) => `- ${questionId}`)
      : ["- 없음"]),
    "",
    "## Changed Counts",
    "",
    ...CATEGORY_KEYS.map((category) => `- ${category}: ${report.changedCountsByCategory[category]}`),
    "",
    "## Required Sample Review",
    "",
    ...(report.requiredSampleReviewIds.length
      ? report.requiredSampleReviewIds.map((questionId) => `- ${questionId}`)
      : ["- 없음"]),
    "",
    "## New Tags",
    "",
    ...(report.newTags.length ? report.newTags.map((tag) => `- ${tag}`) : ["- 없음"]),
    "",
    "## Difficulty Drift",
    "",
    `- Whole bank: 기초 ${report.wholeBankDifficultyPercent.기초}%, 실전 ${report.wholeBankDifficultyPercent.실전}%, 응용 ${report.wholeBankDifficultyPercent.응용}%`,
    `- Batch only: 기초 ${report.batchDifficultyPercent.기초}%, 실전 ${report.batchDifficultyPercent.실전}%, 응용 ${report.batchDifficultyPercent.응용}%`,
    "",
    "## Validation Errors",
    "",
    ...(report.validationErrors.length ? report.validationErrors.map((line) => `- ${line}`) : ["- 없음"]),
    "",
    "## Validation Warnings",
    "",
    ...(report.validationWarnings.length ? report.validationWarnings.map((line) => `- ${line}`) : ["- 없음"]),
    "",
    "## Exact Duplicates",
    "",
    ...(report.exactDuplicates.length
      ? report.exactDuplicates.map((group) => `- ${group.join(", ")}`)
      : ["- 없음"]),
    "",
    "## Near Duplicates",
    "",
    ...(report.nearDuplicates.length
      ? report.nearDuplicates.map(
          (group) =>
            `- ${group.questionIds.join(", ")}${group.differingFields?.length ? ` (diff: ${group.differingFields.join(", ")})` : ""}`,
        )
      : ["- 없음"]),
    "",
  ];

  return `${lines.join("\n")}\n`;
};
