import type { AnswerChoice, TrainingCategory } from "../training-data";

export type AppView = "home" | "training" | "wrongs" | "records" | "liveTips" | "quiz";
export type AppTab = "home" | "training" | "wrongs" | "records";
export type WrongFilter = "all" | TrainingCategory | "liveTips";

export type Settings = {
  language: "ko";
  vibration: boolean;
  sound: boolean;
  dailyGoal: 5 | 10 | 20;
};

export type ResponseEntry = {
  questionId: string;
  category: TrainingCategory;
  choice: AnswerChoice;
  correct: boolean;
  correctChoice: AnswerChoice;
  answeredAt: string;
  tags: string[];
};

export type SessionResult = {
  questionId: string;
  choice: AnswerChoice;
  correct: boolean;
};

export type Session = {
  key: string;
  label: string;
  questionIds: string[];
  index: number;
  results: SessionResult[];
};

export type Store = {
  settings: Settings;
  responses: ResponseEntry[];
  tipChecks: Record<string, boolean>;
  sessions: Record<string, Session>;
};

export type Feedback = {
  questionId: string;
  choice: AnswerChoice;
  correct: boolean;
  questionNumber: number;
};

export type Summary = {
  label: string;
  total: number;
  correct: number;
};

export type TrendPoint = {
  label: string;
  count: number;
};
