import type { AnswerChoice, TrainingCategory } from "@/lib/training-data";
import type {
  AppTab,
  AppView,
  Feedback,
  Session,
  Settings,
  Store,
  Summary,
  WrongFilter,
} from "@/lib/holdem/types";

export type HoldemReadyAppState = {
  store: Store;
  view: AppView;
  tab: AppTab;
  session: Session | null;
  feedback: Feedback | null;
  summary: Summary | null;
  settingsOpen: boolean;
  wrongFilter: WrongFilter;
  nowIso?: string;
};

export type HoldemReadyAppActions = {
  openTab: (next: AppTab) => void;
  setSettingsOpen: (open: boolean) => void;
  startDaily: () => void;
  openLiveTips: () => void;
  startWrongs: (category?: TrainingCategory) => void;
  startWeakness: (tag: string) => void;
  answer: (choice: AnswerChoice) => void;
  next: () => void;
  toggleTip: (tipId: string) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  resetAll: () => void;
  exitQuiz: () => void;
  setWrongFilter: (filter: WrongFilter) => void;
  reviewWrong: (questionId: string) => void;
  reviewQuestion: (questionId: string) => void;
};

const noop = () => undefined;

export const HOLDEM_READY_NOOP_ACTIONS: HoldemReadyAppActions = {
  openTab: noop,
  setSettingsOpen: noop,
  startDaily: noop,
  openLiveTips: noop,
  startWrongs: noop,
  startWeakness: noop,
  answer: noop,
  next: noop,
  toggleTip: noop,
  updateSettings: noop,
  resetAll: noop,
  exitQuiz: noop,
  setWrongFilter: noop,
  reviewWrong: noop,
  reviewQuestion: noop,
};
