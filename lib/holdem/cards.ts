export const CARD_RANKS = [
  "A",
  "K",
  "Q",
  "J",
  "T",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
] as const;

export const CARD_SUITS = ["s", "h", "d", "c"] as const;

export type CardRank = (typeof CARD_RANKS)[number];
export type CardSuit = (typeof CARD_SUITS)[number];
export type CardCode = `${CardRank}${CardSuit}`;
export type HoleCards = readonly [CardCode, CardCode];

const CARD_RANK_ORDER = Object.fromEntries(
  CARD_RANKS.map((rank, index) => [rank, index]),
) as Record<CardRank, number>;

const CARD_CODE_SET = new Set<CardCode>();

export const CARD_CODES = CARD_RANKS.flatMap((rank) =>
  CARD_SUITS.map((suit) => {
    const code = `${rank}${suit}` as CardCode;
    CARD_CODE_SET.add(code);
    return code;
  }),
);

export const CARD_BACK_ASSET_PATH = "/cards/back.svg";

const rankNames: Record<CardRank, string> = {
  A: "Ace",
  K: "King",
  Q: "Queen",
  J: "Jack",
  T: "Ten",
  "9": "Nine",
  "8": "Eight",
  "7": "Seven",
  "6": "Six",
  "5": "Five",
  "4": "Four",
  "3": "Three",
  "2": "Two",
};

const suitNames: Record<CardSuit, string> = {
  s: "Spades",
  h: "Hearts",
  d: "Diamonds",
  c: "Clubs",
};

const suitSymbols: Record<CardSuit, string> = {
  s: "♠",
  h: "♥",
  d: "♦",
  c: "♣",
};

export const isCardCode = (value: unknown): value is CardCode =>
  typeof value === "string" && CARD_CODE_SET.has(value as CardCode);

export const getCardLabel = (card: CardCode) => {
  const rank = card[0] as CardRank;
  const suit = card[1] as CardSuit;
  return `${rankNames[rank]} of ${suitNames[suit]}`;
};

export const getCardVisualLabel = (card: CardCode) => {
  const rank = card[0] as CardRank;
  const suit = card[1] as CardSuit;
  return `${rank}${suitSymbols[suit]}`;
};

export const getHandNotation = (holeCards: HoleCards) => {
  const [first, second] = holeCards;
  const firstRank = first[0] as CardRank;
  const secondRank = second[0] as CardRank;
  const firstSuit = first[1] as CardSuit;
  const secondSuit = second[1] as CardSuit;

  if (firstRank === secondRank) {
    return `${firstRank}${secondRank}`;
  }

  const orderedRanks =
    CARD_RANK_ORDER[firstRank] < CARD_RANK_ORDER[secondRank]
      ? [firstRank, secondRank]
      : [secondRank, firstRank];

  return `${orderedRanks[0]}${orderedRanks[1]}${firstSuit === secondSuit ? "s" : "o"}`;
};
