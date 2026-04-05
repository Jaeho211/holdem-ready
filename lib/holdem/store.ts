import { DEFAULT_SETTINGS, STORAGE_KEY, createDefaultStore } from "./constants";
import { getQuestion, isQuestionId, isValidChoice, TIP_IDS } from "./questions";
import type {
  ResponseEntry,
  Session,
  SessionResult,
  Settings,
  Store,
} from "./types";
import { clamp } from "./utils";

export const STORE_BACKUP_SCHEMA = "holdem-quiz-backup";
export const STORE_BACKUP_VERSION = 1;

type StorageReader = {
  getItem(key: string): string | null;
};

type StorageWriter = {
  setItem(key: string, value: string): void;
};

const VALID_DAILY_GOALS: ReadonlyArray<Settings["dailyGoal"]> = [5, 10, 20];
const ISO_FALLBACK = new Date(0).toISOString();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getBrowserStorage = (): (StorageReader & StorageWriter) | null => {
  if (typeof window === "undefined" || !("localStorage" in window)) return null;
  return window.localStorage;
};

const normalizeSettings = (value: unknown): Settings => {
  if (!isRecord(value)) return { ...DEFAULT_SETTINGS };

  return {
    language: value.language === "ko" ? "ko" : DEFAULT_SETTINGS.language,
    vibration:
      typeof value.vibration === "boolean"
        ? value.vibration
        : DEFAULT_SETTINGS.vibration,
    sound: typeof value.sound === "boolean" ? value.sound : DEFAULT_SETTINGS.sound,
    dailyGoal: VALID_DAILY_GOALS.includes(value.dailyGoal as Settings["dailyGoal"])
      ? (value.dailyGoal as Settings["dailyGoal"])
      : DEFAULT_SETTINGS.dailyGoal,
  };
};

const normalizeAnsweredAt = (value: unknown) => {
  if (typeof value !== "string") return ISO_FALLBACK;
  return Number.isNaN(Date.parse(value)) ? ISO_FALLBACK : value;
};

const normalizeResponseEntry = (value: unknown): ResponseEntry | null => {
  if (!isRecord(value) || !isQuestionId(value.questionId)) return null;

  const question = getQuestion(value.questionId);
  if (!question || !isValidChoice(question, value.choice)) return null;

  return {
    questionId: question.id,
    category: question.category,
    choice: value.choice,
    correct: value.choice === question.correct,
    correctChoice: question.correct,
    answeredAt: normalizeAnsweredAt(value.answeredAt),
    tags: [...question.tags],
  };
};

const normalizeSessionResult = (
  value: unknown,
  sessionQuestionIds: Set<string>,
): SessionResult | null => {
  if (!isRecord(value) || !isQuestionId(value.questionId) || !sessionQuestionIds.has(value.questionId)) {
    return null;
  }

  const question = getQuestion(value.questionId);
  if (!question || !isValidChoice(question, value.choice)) return null;

  return {
    questionId: question.id,
    choice: value.choice,
    correct: value.choice === question.correct,
  };
};

const normalizeQuestionIds = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(value.filter((questionId): questionId is string => isQuestionId(questionId))),
  );
};

const normalizeSession = (
  sessionKey: string,
  value: unknown,
): Session | null => {
  if (!isRecord(value)) return null;

  const questionIds = normalizeQuestionIds(value.questionIds);
  if (!questionIds.length) return null;

  const sessionQuestionIds = new Set(questionIds);
  const rawResults = Array.isArray(value.results) ? value.results : [];
  const results = rawResults
    .map((result) => normalizeSessionResult(result, sessionQuestionIds))
    .filter((result): result is SessionResult => Boolean(result));
  const rawIndex = typeof value.index === "number" ? Math.trunc(value.index) : results.length;
  const index = clamp(Math.max(rawIndex, results.length), 0, questionIds.length);

  return {
    key: typeof value.key === "string" && value.key.length ? value.key : sessionKey,
    label:
      typeof value.label === "string" && value.label.length ? value.label : sessionKey,
    questionIds,
    index,
    results: results.slice(0, index),
  };
};

const normalizeTipChecks = (value: unknown) => {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(
      ([tipId, checked]) => TIP_IDS.has(tipId) && checked === true,
    ),
  ) as Record<string, boolean>;
};

const normalizeSessions = (value: unknown) => {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .map(([sessionKey, session]) => [sessionKey, normalizeSession(sessionKey, session)] as const)
      .filter((entry): entry is [string, Session] => Boolean(entry[1])),
  );
};

export const normalizeStore = (value: unknown): Store => {
  if (!isRecord(value)) return createDefaultStore();

  return {
    settings: normalizeSettings(value.settings),
    responses: Array.isArray(value.responses)
      ? value.responses
          .map((entry) => normalizeResponseEntry(entry))
          .filter((entry): entry is ResponseEntry => Boolean(entry))
      : [],
    tipChecks: normalizeTipChecks(value.tipChecks),
    sessions: normalizeSessions(value.sessions),
  };
};

export const parseStore = (raw: string | null | undefined): Store => {
  if (!raw) return createDefaultStore();

  try {
    return normalizeStore(JSON.parse(raw));
  } catch {
    return createDefaultStore();
  }
};

export const createStoreBackupPayload = (store: Store) => ({
  schema: STORE_BACKUP_SCHEMA,
  version: STORE_BACKUP_VERSION,
  exportedAt: new Date().toISOString(),
  store: normalizeStore(store),
});

export const serializeStoreBackup = (store: Store) =>
  JSON.stringify(createStoreBackupPayload(store), null, 2);

export const parseStoreBackup = (raw: string | null | undefined): Store => {
  if (!raw) {
    throw new Error("Backup file is empty.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Backup file is not valid JSON.");
  }

  if (
    isRecord(parsed) &&
    parsed.schema === STORE_BACKUP_SCHEMA &&
    parsed.version === STORE_BACKUP_VERSION
  ) {
    return normalizeStore(parsed.store);
  }

  if (isRecord(parsed) && "settings" in parsed) {
    return normalizeStore(parsed);
  }

  throw new Error("Backup file is not a supported Holdem Quiz backup.");
};

export const loadStore = (storage: StorageReader | null = getBrowserStorage()) => {
  if (!storage) return createDefaultStore();
  return parseStore(storage.getItem(STORAGE_KEY));
};

export const serializeStore = (store: Store) => JSON.stringify(normalizeStore(store));

export const saveStore = (
  store: Store,
  storage: StorageWriter | null = getBrowserStorage(),
) => {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, serializeStore(store));
};
