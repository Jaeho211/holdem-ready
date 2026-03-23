import {
  categoryMeta,
  questionBank,
  type AnswerChoice,
  type HoldemQuestion,
  type TrainingCategory,
} from "../training-data";
import {
  CATEGORY_SESSION_SIZE,
  DAILY_SESSION_SIZE,
  MAX_RESPONSES,
  WEAKNESS_SESSION_SIZE,
  WRONGS_SESSION_SIZE,
} from "./constants";
import { getWrongEntries } from "./selectors";
import type { Feedback, ResponseEntry, Session, Store } from "./types";
import { dayKey, shuffleItems } from "./utils";

const allQuestionIds = questionBank.map((question) => question.id);

export const getDailySessionKey = (date: Date = new Date()) => `daily:${dayKey(date)}`;

export const createSession = (
  key: string,
  label: string,
  questionIds: string[],
): Session => ({
  key,
  label,
  questionIds: Array.from(new Set(questionIds)),
  index: 0,
  results: [],
});

export const buildDailySession = (random: () => number = Math.random) =>
  createSession(
    getDailySessionKey(),
    "오늘의 10문제",
    shuffleItems(allQuestionIds, random).slice(0, DAILY_SESSION_SIZE),
  );

export const buildCategorySession = (
  category: TrainingCategory,
  random: () => number = Math.random,
) =>
  createSession(
    `category:${category}`,
    categoryMeta[category].label,
    shuffleItems(
      questionBank
        .filter((question) => question.category === category)
        .map((question) => question.id),
      random,
    ).slice(0, CATEGORY_SESSION_SIZE[category]),
  );

export const buildWrongsSession = (
  responses: ResponseEntry[],
  category?: TrainingCategory,
  random: () => number = Math.random,
) => {
  const ids = shuffleItems(
    getWrongEntries(responses, category ?? "all").map((entry) => entry.questionId),
    random,
  ).slice(0, WRONGS_SESSION_SIZE);

  if (!ids.length) return null;

  return createSession(
    category ? `wrongs:${category}` : "wrongs:all",
    category ? `${categoryMeta[category].label} 오답 복습` : "최근 오답 다시 풀기",
    ids,
  );
};

export const buildWeaknessSession = (
  tag: string,
  random: () => number = Math.random,
) => {
  const focusIds = shuffleItems(
    questionBank
      .filter((question) => question.tags.includes(tag))
      .map((question) => question.id),
    random,
  ).slice(0, WEAKNESS_SESSION_SIZE);
  const questionIds = focusIds.length
    ? focusIds
    : shuffleItems(allQuestionIds, random).slice(0, WEAKNESS_SESSION_SIZE);

  return createSession(`weak:${tag}`, `${tag} 5문제`, questionIds);
};

export const upsertSession = (store: Store, session: Session): Store => ({
  ...store,
  sessions: {
    ...store.sessions,
    [session.key]: session,
  },
});

export const removeSession = (store: Store, sessionKey: string): Store => {
  const sessions = { ...store.sessions };
  delete sessions[sessionKey];

  return {
    ...store,
    sessions,
  };
};

export const answerSessionQuestion = ({
  store,
  session,
  question,
  choice,
  answeredAt = new Date().toISOString(),
}: {
  store: Store;
  session: Session;
  question: HoldemQuestion;
  choice: AnswerChoice;
  answeredAt?: string;
}): { nextStore: Store; nextSession: Session; feedback: Feedback } => {
  const correct = choice === question.correct;
  const nextSession: Session = {
    ...session,
    index: session.index + 1,
    results: [...session.results, { questionId: question.id, choice, correct }],
  };

  const response: ResponseEntry = {
    questionId: question.id,
    category: question.category,
    choice,
    correct,
    correctChoice: question.correct,
    answeredAt,
    tags: [...question.tags],
  };

  return {
    nextStore: {
      ...store,
      responses: [response, ...store.responses].slice(0, MAX_RESPONSES),
      sessions: {
        ...store.sessions,
        [nextSession.key]: nextSession,
      },
    },
    nextSession,
    feedback: {
      questionId: question.id,
      choice,
      correct,
      questionNumber: session.index + 1,
    },
  };
};
