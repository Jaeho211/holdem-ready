import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { questionBank, type PreflopQuestion } from "../training-data";
import { CARD_BACK_ASSET_PATH, CARD_CODES, getHandNotation } from "./cards";

const publicPath = (relativePath: string) => new URL(`../../public${relativePath}`, import.meta.url);

describe("card assets and question data", () => {
  it("defines a complete 52-card deck without duplicates", () => {
    expect(CARD_CODES).toHaveLength(52);
    expect(new Set(CARD_CODES).size).toBe(52);
  });

  it("keeps the shared card back asset available", () => {
    expect(existsSync(publicPath(CARD_BACK_ASSET_PATH))).toBe(true);
  });

  it("gives every preflop question explicit hole cards that match its shorthand", () => {
    const preflopQuestions = questionBank.filter(
      (question): question is PreflopQuestion => question.category === "preflop",
    );

    preflopQuestions.forEach((question) => {
      expect(question.holeCards).toHaveLength(2);
      expect(getHandNotation(question.holeCards)).toBe(question.hand);
    });
  });

  it("does not reuse the same physical card twice in any single question", () => {
    questionBank.forEach((question) => {
      const cardsInPlay = [
        ...("holeCards" in question && question.holeCards ? question.holeCards : []),
        ...("board" in question && question.board ? question.board : []),
      ];

      expect(new Set(cardsInPlay).size).toBe(cardsInPlay.length);
    });
  });
});
