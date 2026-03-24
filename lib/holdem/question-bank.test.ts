import { describe, expect, it } from "vitest";
import { getQuestion } from "./questions";

const RANK_VALUE: Record<string, number> = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  T: 10,
  "9": 9,
  "8": 8,
  "7": 7,
  "6": 6,
  "5": 5,
  "4": 4,
  "3": 3,
  "2": 2,
};

const FULL_DECK = Object.keys(RANK_VALUE).flatMap((rank) =>
  ["s", "h", "d", "c"].map((suit) => `${rank}${suit}`),
);

function getRank(card: string) {
  return RANK_VALUE[card[0]];
}

function getSuit(card: string) {
  return card[1];
}

function hasStraight(cards: string[]) {
  const ranks = [...new Set(cards.map(getRank))].sort((a, b) => a - b);
  const wheelAwareRanks = ranks.includes(14) ? [1, ...ranks] : ranks;

  let longest = 1;
  let streak = 1;

  for (let index = 1; index < wheelAwareRanks.length; index += 1) {
    if (wheelAwareRanks[index] === wheelAwareRanks[index - 1] + 1) {
      streak += 1;
      longest = Math.max(longest, streak);
      continue;
    }

    if (wheelAwareRanks[index] !== wheelAwareRanks[index - 1]) {
      streak = 1;
    }
  }

  return longest >= 5;
}

function countStraightOuts(cards: string[]) {
  const usedCards = new Set(cards);

  return FULL_DECK.filter((card) => !usedCards.has(card)).filter((card) =>
    hasStraight([...cards, card]),
  ).length;
}

function countPairs(cards: string[]) {
  const counts = cards.reduce<Record<number, number>>((accumulator, card) => {
    const rank = getRank(card);
    accumulator[rank] = (accumulator[rank] ?? 0) + 1;
    return accumulator;
  }, {});

  return Object.values(counts).filter((count) => count === 2).length;
}

function hasTrips(cards: string[]) {
  const counts = cards.reduce<Record<number, number>>((accumulator, card) => {
    const rank = getRank(card);
    accumulator[rank] = (accumulator[rank] ?? 0) + 1;
    return accumulator;
  }, {});

  return Object.values(counts).some((count) => count === 3);
}

function hasFlushDraw(cards: string[]) {
  const suitCounts = cards.reduce<Record<string, number>>((accumulator, card) => {
    const suit = getSuit(card);
    accumulator[suit] = (accumulator[suit] ?? 0) + 1;
    return accumulator;
  }, {});

  return Object.values(suitCounts).some((count) => count === 4);
}

function countOvercards(holeCards: readonly string[], board: readonly string[]) {
  const topBoardRank = Math.max(...board.map(getRank));
  return holeCards.filter((card) => getRank(card) > topBoardRank).length;
}

describe("question bank review guards", () => {
  it("keeps the gutshot turn spot as exactly four straight outs", () => {
    const question = getQuestion("post-003");

    if (!question || question.category !== "postflop") {
      throw new Error("post-003 is missing");
    }

    expect(hasStraight([...question.holeCards, ...question.board])).toBe(false);
    expect(countStraightOuts([...question.holeCards, ...question.board])).toBe(4);
  });

  it("keeps the nut flush draw spot as one overcard plus a flush draw", () => {
    const question = getQuestion("post-004");

    if (!question || question.category !== "postflop") {
      throw new Error("post-004 is missing");
    }

    expect(hasFlushDraw([...question.holeCards, ...question.board])).toBe(true);
    expect(countOvercards(question.holeCards, question.board)).toBe(1);
  });

  it("keeps the donk bet raise spot as exactly two pair", () => {
    const question = getQuestion("post-005");

    if (!question || question.category !== "postflop") {
      throw new Error("post-005 is missing");
    }

    const cards = [...question.holeCards, ...question.board];
    expect(hasTrips(cards)).toBe(false);
    expect(countPairs(cards)).toBe(2);
  });

  it("keeps the pair plus open-ended spot as eight straight outs with one pair", () => {
    const question = getQuestion("post-008");

    if (!question || question.category !== "postflop") {
      throw new Error("post-008 is missing");
    }

    const cards = [...question.holeCards, ...question.board];
    expect(hasStraight(cards)).toBe(false);
    expect(countPairs(cards)).toBe(1);
    expect(countStraightOuts(cards)).toBe(8);
  });

  it("keeps required-equity pot odds questions aligned with the visible pot math", () => {
    const halfPot = getQuestion("odds-004");
    const twentyIntoEighty = getQuestion("odds-006");

    if (!halfPot || halfPot.category !== "odds" || !twentyIntoEighty || twentyIntoEighty.category !== "odds") {
      throw new Error("odds questions are missing");
    }

    const halfPotRequired = Math.round((parseFloat(halfPot.villainBet) / (parseFloat(halfPot.pot) + parseFloat(halfPot.villainBet))) * 100);
    const twentyIntoEightyRequired = Math.round((parseFloat(twentyIntoEighty.villainBet) / (parseFloat(twentyIntoEighty.pot) + parseFloat(twentyIntoEighty.villainBet))) * 100);

    expect(halfPotRequired).toBe(Number(halfPot.correct));
    expect(twentyIntoEightyRequired).toBe(Number(twentyIntoEighty.correct));
  });
});
