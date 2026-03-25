import { describe, expect, it } from "vitest";
import { createDefaultStore } from "./constants";
import {
  answerSessionQuestion,
  buildCategorySession,
  buildDailySession,
  buildWeaknessSession,
  createSession,
} from "./sessions";
import { questionBank } from "../training-data";
import { shuffleItems } from "./utils";

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

  it("shuffles daily sessions after applying weakness-tagged questions", () => {
    const random = () => 0;
    const session = buildDailySession(
      [
        {
          questionId: "pre-003",
          category: "preflop",
          choice: "call",
          correct: false,
          correctChoice: "fold",
          answeredAt: "2026-03-23T12:00:00+09:00",
          tags: ["SB 디펜스", "오프수트 브로드웨이"],
        },
      ],
      random,
    );
    const focusCandidates: string[] = [];
    const seen = new Set<string>();

    for (const tag of ["SB 디펜스", "오프수트 브로드웨이"]) {
      const matchingIds = shuffleItems(
        questionBank
          .filter((question) => question.tags.includes(tag))
          .map((question) => question.id),
        random,
      );

      for (const questionId of matchingIds) {
        if (seen.has(questionId)) continue;

        seen.add(questionId);
        focusCandidates.push(questionId);

        if (focusCandidates.length >= 5) break;
      }

      if (focusCandidates.length >= 5) break;
    }

    const focusIds = shuffleItems(focusCandidates, random);
    const focusSet = new Set(focusIds);
    const prioritizedQuestionIds = [
      ...focusIds,
      ...shuffleItems(
        questionBank
          .map((question) => question.id)
          .filter((questionId) => !focusSet.has(questionId)),
        random,
      ),
    ].slice(0, 10);

    expect(session.questionIds).toHaveLength(10);
    expect(new Set(session.questionIds).size).toBe(10);
    expect(session.questionIds).toContain("pre-003");
    expect(session.questionIds).not.toEqual(prioritizedQuestionIds);
    expect(session.questionIds).toEqual(shuffleItems(prioritizedQuestionIds, random));
  });

  it("falls back to a shuffled bank when there is no weakness history", () => {
    const session = buildDailySession([], () => 0);

    expect(session.questionIds).toEqual(
      shuffleItems(
        questionBank.map((question) => question.id),
        () => 0,
      ).slice(0, 10),
    );
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
