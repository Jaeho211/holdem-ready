import type { AnswerChoice, TrainingCategory } from "../training-data";
import { liveTipSections } from "../training-data";
import type { Settings, Store } from "./types";

export const STORAGE_KEY = "holdem-quiz:v1";
export const DAILY_SESSION_SIZE = 10;
export const WRONGS_SESSION_SIZE = 10;
export const WEAKNESS_SESSION_SIZE = 5;
export const MAX_RESPONSES = 500;

export const ACTIONS: ReadonlyArray<{ value: AnswerChoice; label: string }> = [
  { value: "fold", label: "Fold" },
  { value: "call", label: "Call" },
  { value: "raise", label: "Raise" },
] as const;

export const CATEGORY_SESSION_SIZE: Record<TrainingCategory, number> = {
  preflop: 8,
  postflop: 6,
  odds: 5,
};

export const FALLBACK_WEAKNESSES = ["SB 디펜스", "탑페어 운영", "포트 오즈"];

export const DEFAULT_SETTINGS: Settings = {
  language: "ko",
  vibration: true,
  sound: false,
  dailyGoal: 10,
};

export const TIP_TOTAL = liveTipSections.reduce((sum, section) => sum + section.items.length, 0);

export const createDefaultStore = (): Store => ({
  settings: { ...DEFAULT_SETTINGS },
  responses: [],
  tipChecks: {},
  sessions: {},
});
