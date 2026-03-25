import { describe, expect, it } from "vitest";
import { getQuestion } from "./questions";
import { questionBank } from "../training-data";
import { oddsQuestions } from "../training-data/questions/odds";
import { postflopQuestions } from "../training-data/questions/postflop";
import { preflopQuestions } from "../training-data/questions/preflop";
import { CARD_CODES } from "./cards";
import {
  calculateOutsFromSpec,
  getOutsHitRatePercent,
  parseOutsCount,
} from "./outs";

const VALID_CARD_SET = new Set<string>(CARD_CODES);

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

/** Parse "30bb", "6.5bb", "20" → number, or NaN if unparsable (e.g. "체크") */
function parseBb(value: string): number {
  return parseFloat(value.replace(/bb$/i, ""));
}

// ─── Existing hand-written review guards ────────────────────────────

describe("question bank review guards", () => {
  it("rebuilds questionBank from category modules in the expected order", () => {
    expect(questionBank).toEqual([
      ...preflopQuestions,
      ...postflopQuestions,
      ...oddsQuestions,
    ]);
    expect(questionBank).toHaveLength(
      preflopQuestions.length + postflopQuestions.length + oddsQuestions.length,
    );
  });

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

// ─── 8-A. 공통 체크리스트 (자동 sweep) ─────────────────────────────

describe("questionBank — 공통 검증 (8-A)", () => {
  const PREFIX_MAP: Record<string, string> = {
    preflop: "pre-",
    postflop: "post-",
    odds: "odds-",
  };

  it("모든 ID가 유일하다", () => {
    const ids = questionBank.map((q) => q.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it.each(questionBank.map((q) => [q.id, q]))(
    "%s — ID 형식이 올바르다 (접두사-NNN)",
    (_id, q) => {
      const prefix = PREFIX_MAP[q.category];
      expect(q.id).toMatch(new RegExp(`^${prefix}\\d{3}$`));
    },
  );

  it.each(questionBank.map((q) => [q.id, q]))(
    "%s — pitfall이 \"~하는 실수\"로 끝난다",
    (_id, q) => {
      expect(q.pitfall).toMatch(/실수$/);
    },
  );

  it.each(questionBank.map((q) => [q.id, q]))(
    "%s — tags가 2개이다",
    (_id, q) => {
      expect(q.tags).toHaveLength(2);
    },
  );

  it.each(questionBank.map((q) => [q.id, q]))(
    "%s — correct 값이 유효한 선택지에 포함된다",
    (_id, q) => {
      if (q.category === "odds") {
        const optionValues = q.options.map((o) => o.value);
        expect(optionValues).toContain(q.correct);
      } else {
        expect(["fold", "call", "raise"]).toContain(q.correct);
      }
    },
  );

  const questionsWithHoleCards = questionBank.filter(
    (q) => "holeCards" in q && q.holeCards,
  );

  it.each(questionsWithHoleCards.map((q) => [q.id, q]))(
    "%s — holeCards가 유효한 CardCode이다",
    (_id, q) => {
      for (const card of q.holeCards as readonly string[]) {
        expect(VALID_CARD_SET.has(card), `invalid card: ${card}`).toBe(true);
      }
    },
  );
});

// ─── 8-B. Postflop 핸드-보드 정합성 (자동 sweep) ───────────────────

describe("questionBank — postflop 정합성 (8-B)", () => {
  const postflopQuestions = questionBank.filter(
    (q) => q.category === "postflop",
  );

  it.each(postflopQuestions.map((q) => [q.id, q]))(
    "%s — 카드 중복 없음",
    (_id, q) => {
      if (q.category !== "postflop") return;
      const allCards = [...q.holeCards, ...q.board];
      expect(allCards.length).toBe(new Set(allCards).size);
    },
  );

  it.each(postflopQuestions.map((q) => [q.id, q]))(
    "%s — 모든 카드가 유효한 CardCode",
    (_id, q) => {
      if (q.category !== "postflop") return;
      for (const card of [...q.holeCards, ...q.board]) {
        expect(VALID_CARD_SET.has(card), `invalid card: ${card}`).toBe(true);
      }
    },
  );

  it.each(postflopQuestions.map((q) => [q.id, q]))(
    "%s — board 길이 3~5장",
    (_id, q) => {
      if (q.category !== "postflop") return;
      expect(q.board.length).toBeGreaterThanOrEqual(3);
      expect(q.board.length).toBeLessThanOrEqual(5);
    },
  );
});

// ─── 8-C. Odds 수학 검증 (자동 sweep) ──────────────────────────────

describe("questionBank — odds 수학 (8-C)", () => {
  const oddsQuestions = questionBank.filter((q) => q.category === "odds");
  const cardOutsQuestions = oddsQuestions.filter(
    (q) =>
      q.category === "odds" &&
      q.holeCards &&
      q.board &&
      parseOutsCount(q.mathFocus) !== null,
  );

  it.each(oddsQuestions.map((q) => [q.id, q]))(
    "%s — correct가 options 중 하나에 존재",
    (_id, q) => {
      if (q.category !== "odds") return;
      const values = q.options.map((o) => o.value);
      expect(values).toContain(q.correct);
    },
  );

  it.each(oddsQuestions.map((q) => [q.id, q]))(
    "%s — options가 정확히 3개",
    (_id, q) => {
      if (q.category !== "odds") return;
      expect(q.options).toHaveLength(3);
    },
  );

  it.each(oddsQuestions.map((q) => [q.id, q]))(
    "%s — holeCards/board 카드 중복 없음 (카드 있는 경우)",
    (_id, q) => {
      if (q.category !== "odds") return;
      const allCards = [...(q.holeCards ?? []), ...(q.board ?? [])];
      if (allCards.length > 0) {
        expect(allCards.length).toBe(new Set(allCards).size);
        for (const card of allCards) {
          expect(VALID_CARD_SET.has(card), `invalid card: ${card}`).toBe(true);
        }
      }
    },
  );

  it.each(cardOutsQuestions.map((q) => [q.id, q]))(
    "%s — 카드 기반 아웃 문제는 outsSpec을 가진다",
    (_id, q) => {
      if (q.category !== "odds" || !q.holeCards || !q.board) return;
      expect(q.outsSpec).toBeDefined();
      expect(q.outsSpec?.components.length).toBeGreaterThan(0);
    },
  );

  it.each(cardOutsQuestions.map((q) => [q.id, q]))(
    "%s — outsSpec 계산 결과가 mathFocus 아웃 수와 일치",
    (_id, q) => {
      if (q.category !== "odds" || !q.holeCards || !q.board || !q.outsSpec) return;
      const expectedOuts = parseOutsCount(q.mathFocus);
      expect(expectedOuts).not.toBeNull();

      const calculated = calculateOutsFromSpec(q.holeCards, q.board, q.outsSpec);
      expect(calculated.outs).toHaveLength(expectedOuts ?? 0);
    },
  );

  it.each(cardOutsQuestions.map((q) => [q.id, q]))(
    "%s — outsSpec 계산 확률이 correct와 1%p 이내",
    (_id, q) => {
      if (q.category !== "odds" || !q.holeCards || !q.board || !q.outsSpec) return;
      const calculated = calculateOutsFromSpec(q.holeCards, q.board, q.outsSpec);
      const expectedPercent = getOutsHitRatePercent(calculated.outs.length, q.board);
      const shownPercent = Number(q.correct);

      expect(Math.abs(expectedPercent - shownPercent)).toBeLessThanOrEqual(1);
    },
  );

  // 필요 승률 자동 검산: pot과 villainBet이 숫자로 파싱 가능한 경우
  const potOddsQuestions = oddsQuestions.filter((q) => {
    if (q.category !== "odds") return false;
    const pot = parseBb(q.pot);
    const bet = parseBb(q.villainBet);
    return !Number.isNaN(pot) && !Number.isNaN(bet) && bet > 0;
  });

  if (potOddsQuestions.length > 0) {
    it.each(potOddsQuestions.map((q) => [q.id, q]))(
      "%s — 포트 오즈 검산: call/(pot+bet+call) = correct%%",
      (_id, q) => {
        if (q.category !== "odds") return;
        const pot = parseBb(q.pot);
        const bet = parseBb(q.villainBet);
        const correctNum = Number(q.correct);
        if (Number.isNaN(correctNum) || !q.mathFocus || q.mathFocus.includes("Outs")) return;

        // pot 필드 해석이 문제마다 다를 수 있음:
        //   A) pot = 빌런 베팅 포함 → call / (pot + call)
        //   B) pot = 빌런 베팅 미포함 → call / (pot + bet + call)
        const equityA = Math.round((bet / (pot + bet)) * 100);
        const equityB = Math.round((bet / (pot + bet + bet)) * 100);
        const matchesEither = equityA === correctNum || equityB === correctNum;
        expect(matchesEither, `pot=${pot} bet=${bet}: A=${equityA}% B=${equityB}% ≠ correct=${correctNum}%`).toBe(true);
      },
    );
  }
});
