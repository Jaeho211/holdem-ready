import type { HoldemQuestion, TrainingCategory } from "../training-data";
import { FALLBACK_WEAKNESSES } from "./constants";
import type { ResponseEntry, TrendPoint, WrongFilter } from "./types";
import { addDays, dayKey } from "./utils";

export const getChoiceLabel = (question: HoldemQuestion, choice: string) => {
  if (choice === "fold") return "Fold";
  if (choice === "call") return "Call";
  if (choice === "raise") return "Raise";

  return question.category === "odds"
    ? question.options.find((option) => option.value === choice)?.label ?? String(choice)
    : String(choice);
};

export const getOverallAccuracy = (responses: ResponseEntry[]) =>
  responses.length
    ? Math.round(
        (responses.filter((entry) => entry.correct).length / responses.length) * 100,
      )
    : 0;

export const getCategoryAccuracy = (
  responses: ResponseEntry[],
  category: TrainingCategory,
) => {
  const entries = responses.filter((entry) => entry.category === category);

  return entries.length
    ? Math.round((entries.filter((entry) => entry.correct).length / entries.length) * 100)
    : null;
};

export const getWeaknesses = (responses: ResponseEntry[]) => {
  const counts = new Map<string, number>();

  for (const entry of responses.filter((item) => !item.correct).slice(0, 40)) {
    for (const tag of entry.tags.slice(0, 2)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  const tags = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);

  return tags.length ? tags : FALLBACK_WEAKNESSES;
};

export const getWrongEntries = (
  responses: ResponseEntry[],
  filter: WrongFilter,
) => {
  if (filter === "liveTips") return [];

  const seen = new Set<string>();

  return responses.filter((entry) => {
    if (entry.correct) return false;
    if (filter !== "all" && entry.category !== filter) return false;
    if (seen.has(entry.questionId)) return false;

    seen.add(entry.questionId);
    return true;
  });
};

export const getTrend = (responses: ResponseEntry[], now: Date = new Date()): TrendPoint[] =>
  Array.from({ length: 7 }, (_, index) => {
    const date = addDays(now, index - 6);
    const key = dayKey(date);

    return {
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      count: responses.filter((entry) => dayKey(new Date(entry.answeredAt)) === key).length,
    };
  });

export const getStreak = (responses: ResponseEntry[], now: Date = new Date()) => {
  const days = new Set(responses.map((entry) => dayKey(new Date(entry.answeredAt))));
  let total = 0;
  let cursor = now;

  while (days.has(dayKey(cursor))) {
    total += 1;
    cursor = addDays(cursor, -1);
  }

  return total;
};

export const getTodayCount = (responses: ResponseEntry[], now: Date = new Date()) => {
  const today = dayKey(now);
  return responses.filter((entry) => dayKey(new Date(entry.answeredAt)) === today).length;
};
