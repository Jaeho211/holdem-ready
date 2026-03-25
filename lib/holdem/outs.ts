import {
  CARD_CODES,
  type CardCode,
  type CardRank,
  type CardSuit,
  type HoleCards,
} from "./cards";

export type OddsOutsComponent =
  | "straightDraw"
  | "flushDraw"
  | "overcardPair"
  | "holePairImprove"
  | "currentPairTrips"
  | "pocketPairSet";

export type OddsOutsSpec = {
  components: readonly OddsOutsComponent[];
};

type OutsCalculation = {
  outs: CardCode[];
  byComponent: Partial<Record<OddsOutsComponent, CardCode[]>>;
};

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

const getRank = (card: CardCode) => RANK_VALUE[card[0] as CardRank];

const getSuit = (card: CardCode) => card[1] as CardSuit;

const getAllCards = (holeCards: HoleCards, board: readonly CardCode[]) => [
  ...holeCards,
  ...board,
] as const;

const getUnseenCards = (holeCards: HoleCards, board: readonly CardCode[]) => {
  const usedCards = new Set<CardCode>(getAllCards(holeCards, board));
  return CARD_CODES.filter((card) => !usedCards.has(card));
};

const getDistinctHoleRanks = (holeCards: HoleCards) =>
  [...new Set(holeCards.map((card) => card[0] as CardRank))];

const getMatchingRankOutCards = (
  holeCards: HoleCards,
  board: readonly CardCode[],
  ranks: readonly CardRank[],
) => {
  if (ranks.length === 0) {
    return [] as CardCode[];
  }

  return getUnseenCards(holeCards, board).filter((card) =>
    ranks.includes(card[0] as CardRank),
  );
};

export const hasStraight = (cards: readonly CardCode[]) => {
  const ranks = [...new Set(cards.map(getRank))].sort((left, right) => left - right);
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
};

export const getStraightOutCards = (holeCards: HoleCards, board: readonly CardCode[]) => {
  const cards = getAllCards(holeCards, board);

  if (hasStraight(cards)) {
    return [] as CardCode[];
  }

  return getUnseenCards(holeCards, board).filter((card) =>
    hasStraight([...cards, card]),
  );
};

export const getFlushOutCards = (holeCards: HoleCards, board: readonly CardCode[]) => {
  const suitCounts = getAllCards(holeCards, board).reduce<Record<CardSuit, number>>(
    (accumulator, card) => {
      const suit = getSuit(card);
      accumulator[suit] += 1;
      return accumulator;
    },
    { s: 0, h: 0, d: 0, c: 0 },
  );

  const drawSuits = (Object.entries(suitCounts) as [CardSuit, number][])
    .filter(([, count]) => count === 4)
    .map(([suit]) => suit);

  if (drawSuits.length === 0) {
    return [] as CardCode[];
  }

  return getUnseenCards(holeCards, board).filter((card) =>
    drawSuits.includes(getSuit(card)),
  );
};

export const getOvercardPairOutCards = (
  holeCards: HoleCards,
  board: readonly CardCode[],
) => {
  const topBoardRank = Math.max(...board.map(getRank));
  const overcardRanks = getDistinctHoleRanks(holeCards).filter(
    (rank) => RANK_VALUE[rank] > topBoardRank,
  );

  return getMatchingRankOutCards(holeCards, board, overcardRanks);
};

export const getHolePairImproveOutCards = (
  holeCards: HoleCards,
  board: readonly CardCode[],
) => getMatchingRankOutCards(holeCards, board, getDistinctHoleRanks(holeCards));

export const getCurrentPairTripsOutCards = (
  holeCards: HoleCards,
  board: readonly CardCode[],
) => {
  const pairedRanks = getDistinctHoleRanks(holeCards).filter((rank) =>
    board.some((card) => (card[0] as CardRank) === rank),
  );

  return getMatchingRankOutCards(holeCards, board, pairedRanks);
};

export const getPocketPairSetOutCards = (
  holeCards: HoleCards,
  board: readonly CardCode[],
) => {
  const [first, second] = holeCards;

  if (first[0] !== second[0]) {
    return [] as CardCode[];
  }

  const pocketRank = first[0] as CardRank;
  const boardMatches = board.filter((card) => (card[0] as CardRank) === pocketRank);

  if (boardMatches.length > 0) {
    return [] as CardCode[];
  }

  return getMatchingRankOutCards(holeCards, board, [pocketRank]);
};

export const getOutCardsForComponent = (
  holeCards: HoleCards,
  board: readonly CardCode[],
  component: OddsOutsComponent,
) => {
  switch (component) {
    case "straightDraw":
      return getStraightOutCards(holeCards, board);
    case "flushDraw":
      return getFlushOutCards(holeCards, board);
    case "overcardPair":
      return getOvercardPairOutCards(holeCards, board);
    case "holePairImprove":
      return getHolePairImproveOutCards(holeCards, board);
    case "currentPairTrips":
      return getCurrentPairTripsOutCards(holeCards, board);
    case "pocketPairSet":
      return getPocketPairSetOutCards(holeCards, board);
  }
};

export const calculateOutsFromSpec = (
  holeCards: HoleCards,
  board: readonly CardCode[],
  spec: OddsOutsSpec,
): OutsCalculation => {
  const byComponent: Partial<Record<OddsOutsComponent, CardCode[]>> = {};

  for (const component of new Set(spec.components)) {
    byComponent[component] = getOutCardsForComponent(holeCards, board, component);
  }

  const outSet = new Set<CardCode>(Object.values(byComponent).flat());
  const outs = CARD_CODES.filter((card) => outSet.has(card));

  return { outs, byComponent };
};

export const parseOutsCount = (label: string) => {
  const match = label.match(/(\d+)\s*outs/i);
  return match ? Number(match[1]) : null;
};

export const getOutsHitRatePercent = (outsCount: number, board: readonly CardCode[]) => {
  const unseenCards = 52 - 2 - board.length;

  if (board.length === 4) {
    return (outsCount / unseenCards) * 100;
  }

  if (board.length === 3) {
    const missTurn = (unseenCards - outsCount) / unseenCards;
    const missRiver = (unseenCards - outsCount - 1) / (unseenCards - 1);
    return (1 - missTurn * missRiver) * 100;
  }

  throw new Error(`Unsupported board length for outs math: ${board.length}`);
};
