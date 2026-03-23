import {
  liveTipSections,
  questionBank,
  type AnswerChoice,
  type HoldemQuestion,
} from "../training-data";

export const QUESTIONS_BY_ID = Object.fromEntries(
  questionBank.map((question) => [question.id, question]),
) as Record<string, HoldemQuestion>;

export const QUESTION_IDS = new Set(questionBank.map((question) => question.id));
export const TIP_IDS = new Set(
  liveTipSections.flatMap((section) => section.items.map((item) => item.id)),
);

export const getQuestion = (questionId: string) => QUESTIONS_BY_ID[questionId];

export const isQuestionId = (value: unknown): value is string =>
  typeof value === "string" && QUESTION_IDS.has(value);

export const getQuestionChoices = (question: HoldemQuestion): AnswerChoice[] =>
  question.category === "odds"
    ? question.options.map((option) => option.value)
    : ["fold", "call", "raise"];

export const isValidChoice = (
  question: HoldemQuestion,
  value: unknown,
): value is AnswerChoice =>
  typeof value === "string" && getQuestionChoices(question).includes(value);
