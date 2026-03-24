import { describe, expect, it } from "vitest";
import { createDefaultStore } from "./constants";
import {
  answerSessionQuestion,
  buildCategorySession,
  buildWeaknessSession,
  createSession,
} from "./sessions";
import { questionBank } from "../training-data";

describe("session helpers", () => {
  it("deduplicates question ids when creating a session", () => {
    const session = createSession("daily:2026-03-23", "오늘의 10문제", [
      "pre-001",
      "pre-001",
      "pre-002",
    ]);

    expect(session.questionIds).toEqual(["pre-001", "pre-002"]);
    expect(session.index).toBe(0);
    expect(session.results).toEqual([]);
  });

  it("builds category sessions with the configured size", () => {
    const session = buildCategorySession("preflop", () => 0);

    expect(session.questionIds).toHaveLength(8);
    expect(new Set(session.questionIds).size).toBe(8);
    expect(session.questionIds.every((questionId) => questionId.startsWith("pre-"))).toBe(true);
  });

  it("falls back to the full bank when a weakness tag has no direct matches", () => {
    const session = buildWeaknessSession("없는 태그", () => 0);

    expect(session.questionIds).toHaveLength(5);
    expect(new Set(session.questionIds).size).toBe(5);
  });

  it("records answers and advances the active session", () => {
    const question = questionBank[0];
    const store = createDefaultStore();
    const session = createSession("category:preflop", "Preflop", [question.id]);
    const { nextStore, nextSession, feedback } = answerSessionQuestion({
      store,
      session,
      question,
      choice: question.correct,
      answeredAt: "2026-03-23T10:00:00+09:00",
    });

    expect(nextSession.index).toBe(1);
    expect(nextSession.results).toEqual([
      {
        questionId: question.id,
        choice: question.correct,
        correct: true,
      },
    ]);
    expect(nextStore.responses[0]).toMatchObject({
      questionId: question.id,
      category: question.category,
      choice: question.correct,
      correct: true,
      correctChoice: question.correct,
      answeredAt: "2026-03-23T10:00:00+09:00",
    });
    expect(nextStore.sessions[session.key]).toEqual(nextSession);
    expect(feedback).toEqual({
      questionId: question.id,
      choice: question.correct,
      correct: true,
      questionNumber: 1,
    });
  });
});
