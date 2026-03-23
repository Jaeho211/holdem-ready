import { describe, expect, it, vi } from "vitest";
import { createDefaultStore } from "./constants";
import { loadStore, parseStore } from "./store";
import { liveTipSections, questionBank } from "../training-data";

describe("store normalization", () => {
  it("falls back to defaults when storage JSON is malformed", () => {
    const storage = {
      getItem: vi.fn(() => "{not-json"),
    };

    expect(loadStore(storage)).toEqual(createDefaultStore());
  });

  it("normalizes persisted fields and removes invalid question references", () => {
    const validQuestion = questionBank[0];
    const nextQuestion = questionBank[1];
    const tipId = liveTipSections[0].items[0].id;
    const raw = JSON.stringify({
      settings: {
        language: "en",
        vibration: false,
        sound: "yes",
        dailyGoal: 99,
      },
      responses: [
        {
          questionId: validQuestion.id,
          category: "odds",
          choice: validQuestion.correct,
          correct: false,
          correctChoice: "fold",
          answeredAt: "invalid-date",
          tags: ["wrong"],
        },
        {
          questionId: "missing-question",
          choice: "raise",
          answeredAt: "2026-03-20T12:00:00+09:00",
        },
      ],
      tipChecks: {
        [tipId]: true,
        unknown: true,
      },
      sessions: {
        "category:preflop": {
          key: "category:preflop",
          label: "프리플랍",
          questionIds: [validQuestion.id, "missing-question", nextQuestion.id, validQuestion.id],
          index: 8,
          results: [
            { questionId: validQuestion.id, choice: validQuestion.correct, correct: false },
            { questionId: "missing-question", choice: "call", correct: true },
          ],
        },
        broken: {
          key: "broken",
          label: "broken",
          questionIds: ["missing-question"],
          index: 0,
          results: [],
        },
      },
    });

    const store = parseStore(raw);
    const normalizedResponse = store.responses[0];
    const session = store.sessions["category:preflop"];

    expect(store.settings).toEqual({
      language: "ko",
      vibration: false,
      sound: false,
      dailyGoal: 10,
    });
    expect(normalizedResponse).toMatchObject({
      questionId: validQuestion.id,
      category: validQuestion.category,
      choice: validQuestion.correct,
      correct: true,
      correctChoice: validQuestion.correct,
      tags: validQuestion.tags,
    });
    expect(normalizedResponse.answeredAt).toBe("1970-01-01T00:00:00.000Z");
    expect(store.tipChecks).toEqual({ [tipId]: true });
    expect(Object.keys(store.sessions)).toEqual(["category:preflop"]);
    expect(session.questionIds).toEqual([validQuestion.id, nextQuestion.id]);
    expect(session.index).toBe(2);
    expect(session.results).toEqual([
      {
        questionId: validQuestion.id,
        choice: validQuestion.correct,
        correct: true,
      },
    ]);
  });

  it("returns defaults when storage is unavailable", () => {
    expect(loadStore(null)).toEqual(createDefaultStore());
  });
});
