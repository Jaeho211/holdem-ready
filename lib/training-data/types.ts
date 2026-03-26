import type { CardCode, HoleCards } from "../holdem/cards";
import type { OddsOutsSpec } from "../holdem/outs";

export type TrainingCategory = "preflop" | "postflop" | "odds";
export type AppTrainingCategory = TrainingCategory | "liveTips";
export type DecisionChoice = "fold" | "call" | "raise";
export type AnswerChoice = DecisionChoice | string;

export type ChoiceOption = {
  value: AnswerChoice;
  label: string;
};

export type PostflopStreet = "flop" | "turn" | "river";
export type PostflopMadeHand =
  | "topPair"
  | "middlePair"
  | "bottomPair"
  | "overpair"
  | "twoPair"
  | "set"
  | "trips"
  | "straight"
  | "flush"
  | "fullHouse";
export type PostflopDraw =
  | "flushDraw"
  | "nutFlushDraw"
  | "oesd"
  | "gutshot"
  | "comboDraw";
export type PostflopBoardTexture = "dry" | "wet";
export type PostflopSuitTexture = "rainbow" | "twoTone" | "mono";
export type PostflopReviewSpec = {
  street: PostflopStreet;
  madeHand?: PostflopMadeHand;
  draws?: readonly PostflopDraw[];
  boardTexture?: PostflopBoardTexture;
  suitTexture?: PostflopSuitTexture;
};

type QuestionBase = {
  id: string;
  category: TrainingCategory;
  difficulty: "기초" | "실전" | "응용";
  title: string;
  prompt: string;
  explanation: string;
  pitfall: string;
  tags: string[];
};

export type PreflopQuestion = QuestionBase & {
  category: "preflop";
  hand: string;
  holeCards: HoleCards;
  position: string;
  table: string;
  stack: string;
  actionBefore: string;
  correct: DecisionChoice;
};

export type PostflopQuestion = QuestionBase & {
  category: "postflop";
  position: string;
  preflopAction: string;
  holeCards: HoleCards;
  board: CardCode[];
  pot: string;
  villainBet: string;
  actionBefore: string;
  stack: string;
  reviewSpec: PostflopReviewSpec;
  correct: DecisionChoice;
};

export type OddsQuestion = QuestionBase & {
  category: "odds";
  holeCards?: HoleCards;
  board?: CardCode[];
  outsSpec?: OddsOutsSpec;
  pot: string;
  villainBet: string;
  actionBefore: string;
  mathFocus: string;
  options: ChoiceOption[];
  correct: AnswerChoice;
};

export type HoldemQuestion = PreflopQuestion | PostflopQuestion | OddsQuestion;

export type LiveTipSection = {
  id: string;
  title: string;
  subtitle: string;
  items: {
    id: string;
    label: string;
    detail: string;
  }[];
};
