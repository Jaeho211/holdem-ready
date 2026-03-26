import { getFlushOutCards, getStraightOutCards, hasStraight } from "./outs";
import type { CardCode, CardRank, CardSuit, HoleCards } from "./cards";
import type {
  PostflopBoardTexture,
  PostflopDraw,
  PostflopMadeHand,
  PostflopReviewSpec,
  PostflopStreet,
  PostflopSuitTexture,
} from "../training-data";

const RANK_VALUE: Record<CardRank, number> = {
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

const getRank = (card: CardCode) => card[0] as CardRank;
const getSuit = (card: CardCode) => card[1] as CardSuit;

const getAllCards = (holeCards: HoleCards, board: readonly CardCode[]) => [
  ...holeCards,
  ...board,
] as const;

const getRankCounts = (cards: readonly CardCode[]) =>
  cards.reduce<Record<CardRank, number>>((accumulator, card) => {
    const rank = getRank(card);
    accumulator[rank] = (accumulator[rank] ?? 0) + 1;
    return accumulator;
  }, {} as Record<CardRank, number>);

const getSuitCounts = (cards: readonly CardCode[]) =>
  cards.reduce<Record<CardSuit, number>>(
    (accumulator, card) => {
      const suit = getSuit(card);
      accumulator[suit] += 1;
      return accumulator;
    },
    { s: 0, h: 0, d: 0, c: 0 },
  );

const getSortedBoardRanks = (board: readonly CardCode[]) =>
  [...new Set(board.map(getRank))]
    .sort((left, right) => RANK_VALUE[right] - RANK_VALUE[left]);

const getStraightPressure = (board: readonly CardCode[]) => {
  const ranks = getSortedBoardRanks(board).map((rank) => RANK_VALUE[rank]);

  for (let start = 0; start <= ranks.length - 3; start += 1) {
    const window = ranks.slice(start, start + 3);
    if (window[0] - window[window.length - 1] <= 4) {
      return true;
    }
  }

  for (let start = 0; start <= ranks.length - 4; start += 1) {
    const window = ranks.slice(start, start + 4);
    if (window[0] - window[window.length - 1] <= 5) {
      return true;
    }
  }

  return false;
};

export const derivePostflopStreet = (
  board: readonly CardCode[],
): PostflopStreet => {
  if (board.length === 3) {
    return "flop";
  }

  if (board.length === 4) {
    return "turn";
  }

  if (board.length === 5) {
    return "river";
  }

  throw new Error(`Unsupported postflop board length: ${board.length}`);
};

export const derivePostflopSuitTexture = (
  board: readonly CardCode[],
): PostflopSuitTexture => {
  const maxSuitCount = Math.max(...Object.values(getSuitCounts(board)));

  if (maxSuitCount >= 3) {
    return "mono";
  }

  if (maxSuitCount >= 2) {
    return "twoTone";
  }

  return "rainbow";
};

export const derivePostflopBoardTexture = (
  board: readonly CardCode[],
): PostflopBoardTexture => {
  const suitTexture = derivePostflopSuitTexture(board);
  const flushPressure = suitTexture !== "rainbow";

  return flushPressure || getStraightPressure(board) ? "wet" : "dry";
};

export const derivePostflopMadeHand = (
  holeCards: HoleCards,
  board: readonly CardCode[],
): PostflopMadeHand | undefined => {
  const cards = getAllCards(holeCards, board);
  const rankCounts = getRankCounts(cards);
  const countValues = Object.values(rankCounts).sort((left, right) => right - left);
  const boardRanks = getSortedBoardRanks(board);
  const [firstHole, secondHole] = holeCards;
  const firstRank = getRank(firstHole);
  const secondRank = getRank(secondHole);
  const holePair = firstRank === secondRank;
  const pairRanks = Object.entries(rankCounts)
    .filter(([, count]) => count >= 2)
    .map(([rank]) => rank as CardRank)
    .sort((left, right) => RANK_VALUE[right] - RANK_VALUE[left]);

  const hasFlush = Math.max(...Object.values(getSuitCounts(cards))) >= 5;
  const hasMadeStraight = hasStraight(cards);

  if (countValues[0] === 3 && countValues[1] === 2) {
    return "fullHouse";
  }

  if (hasFlush) {
    return "flush";
  }

  if (hasMadeStraight) {
    return "straight";
  }

  if (countValues[0] === 3) {
    if (holePair && board.some((card) => getRank(card) === firstRank)) {
      return "set";
    }

    return "trips";
  }

  if (pairRanks.length >= 2) {
    return "twoPair";
  }

  if (holePair) {
    const topBoardRank = Math.max(...boardRanks.map((rank) => RANK_VALUE[rank]));
    return RANK_VALUE[firstRank] > topBoardRank ? "overpair" : undefined;
  }

  const pairedHoleRank = [firstRank, secondRank].find((rank) =>
    board.some((card) => getRank(card) === rank),
  );

  if (!pairedHoleRank) {
    return undefined;
  }

  const matchedIndex = boardRanks.findIndex((rank) => rank === pairedHoleRank);
  if (matchedIndex === 0) {
    return "topPair";
  }

  if (matchedIndex === 1) {
    return "middlePair";
  }

  return "bottomPair";
};

const getFlushDrawSuits = (holeCards: HoleCards, board: readonly CardCode[]) =>
  (Object.entries(getSuitCounts(getAllCards(holeCards, board))) as [CardSuit, number][])
    .filter(([, count]) => count === 4)
    .map(([suit]) => suit);

export const derivePostflopDraws = (
  holeCards: HoleCards,
  board: readonly CardCode[],
): PostflopDraw[] => {
  const draws: PostflopDraw[] = [];
  const flushDrawSuits = getFlushDrawSuits(holeCards, board);
  const flushDraw = getFlushOutCards(holeCards, board).length > 0;
  const straightOuts = getStraightOutCards(holeCards, board).length;
  const oesd = straightOuts >= 8;
  const gutshot = straightOuts === 4;

  if (flushDraw) {
    const hasNutFlushDraw = flushDrawSuits.some((suit) =>
      holeCards.some((card) => getRank(card) === "A" && getSuit(card) === suit),
    );
    draws.push(hasNutFlushDraw ? "nutFlushDraw" : "flushDraw");
  }

  if (oesd) {
    draws.push("oesd");
  } else if (gutshot) {
    draws.push("gutshot");
  }

  if (draws.length >= 2) {
    draws.push("comboDraw");
  }

  return draws;
};

export const derivePostflopReviewSpec = (
  holeCards: HoleCards,
  board: readonly CardCode[],
): PostflopReviewSpec => {
  const madeHand = derivePostflopMadeHand(holeCards, board);
  const draws = derivePostflopDraws(holeCards, board);

  return {
    street: derivePostflopStreet(board),
    madeHand,
    draws: draws.length ? draws : undefined,
    boardTexture: derivePostflopBoardTexture(board),
    suitTexture: derivePostflopSuitTexture(board),
  };
};
