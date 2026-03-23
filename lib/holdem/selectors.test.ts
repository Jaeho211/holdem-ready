import { describe, expect, it } from "vitest";
import { getQuestion } from "./questions";
import {
  getCategoryAccuracy,
  getOverallAccuracy,
  getStreak,
  getTodayCount,
  getTrend,
  getWeaknesses,
  getWrongEntries,
} from "./selectors";
import type { ResponseEntry } from "./types";

const makeResponse = (
  questionId: string,
  answeredAt: string,
  overrides: Partial<ResponseEntry> = {},
): ResponseEntry => {
  const question = getQuestion(questionId)!;
  const choice = overrides.choice ?? question.correct;
  const correct = overrides.correct ?? choice === question.correct;

  return {
    questionId: question.id,
    category: overrides.category ?? question.category,
    choice,
    correct,
    correctChoice: question.correct,
    answeredAt,
    tags: overrides.tags ?? question.tags,
  };
};

describe("selectors", () => {
  it("deduplicates wrong entries by question id and respects category filters", () => {
    const responses = [
      makeResponse("pre-001", "2026-03-23T12:00:00+09:00", { choice: "raise", correct: false }),
      makeResponse("pre-001", "2026-03-22T12:00:00+09:00", { choice: "call", correct: false }),
      makeResponse("post-001", "2026-03-21T12:00:00+09:00", { choice: "fold", correct: false }),
      makeResponse("odds-001", "2026-03-20T12:00:00+09:00"),
    ];

    expect(getWrongEntries(responses, "all").map((entry) => entry.questionId)).toEqual([
      "pre-001",
      "post-001",
    ]);
    expect(getWrongEntries(responses, "preflop").map((entry) => entry.questionId)).toEqual([
      "pre-001",
    ]);
    expect(getWrongEntries(responses, "liveTips")).toEqual([]);
  });

  it("computes weaknesses from recent incorrect answers and falls back when empty", () => {
    const responses = [
      makeResponse("pre-003", "2026-03-23T12:00:00+09:00", { choice: "call", correct: false }),
      makeResponse("post-001", "2026-03-22T12:00:00+09:00", { choice: "fold", correct: false }),
      makeResponse("odds-001", "2026-03-21T12:00:00+09:00"),
    ];

    expect(getWeaknesses(responses)).toEqual(["SB 디펜스", "오프수트 브로드웨이", "탑페어 운영"]);
    expect(getWeaknesses([])).toEqual(["SB 디펜스", "탑페어 운영", "포트 오즈"]);
  });

  it("calculates accuracy summaries", () => {
    const responses = [
      makeResponse("pre-001", "2026-03-23T12:00:00+09:00"),
      makeResponse("pre-002", "2026-03-22T12:00:00+09:00", { choice: "fold", correct: false }),
      makeResponse("odds-001", "2026-03-21T12:00:00+09:00"),
    ];

    expect(getOverallAccuracy(responses)).toBe(67);
    expect(getCategoryAccuracy(responses, "preflop")).toBe(50);
    expect(getCategoryAccuracy(responses, "postflop")).toBeNull();
  });

  it("builds daily trend and streak from answer dates", () => {
    const now = new Date("2026-03-23T12:00:00+09:00");
    const responses = [
      makeResponse("pre-001", "2026-03-23T09:00:00+09:00"),
      makeResponse("pre-002", "2026-03-22T09:00:00+09:00", { choice: "fold", correct: false }),
      makeResponse("post-001", "2026-03-22T20:00:00+09:00"),
      makeResponse("odds-001", "2026-03-21T09:00:00+09:00"),
      makeResponse("odds-002", "2026-03-19T09:00:00+09:00"),
    ];

    expect(getTodayCount(responses, now)).toBe(1);
    expect(getStreak(responses, now)).toBe(3);
    expect(getTrend(responses, now)).toEqual([
      { label: "3/17", count: 0 },
      { label: "3/18", count: 0 },
      { label: "3/19", count: 1 },
      { label: "3/20", count: 0 },
      { label: "3/21", count: 1 },
      { label: "3/22", count: 2 },
      { label: "3/23", count: 1 },
    ]);
  });
});
