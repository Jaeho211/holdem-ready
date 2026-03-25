import type { HoldemQuestion } from "./types";
import { oddsQuestions } from "./questions/odds";
import { postflopQuestions } from "./questions/postflop";
import { preflopQuestions } from "./questions/preflop";

export const questionBank: HoldemQuestion[] = [
  ...preflopQuestions,
  ...postflopQuestions,
  ...oddsQuestions,
];
