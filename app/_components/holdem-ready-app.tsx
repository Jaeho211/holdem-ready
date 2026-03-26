"use client";

import { useEffect, useState } from "react";
import {
  type TrainingCategory,
} from "@/lib/training-data";
import { createDefaultStore } from "@/lib/holdem/constants";
import { QUESTIONS_BY_ID } from "@/lib/holdem/questions";
import {
  answerSessionQuestion,
  buildDailySession,
  buildSingleQuestionSession,
  buildWeaknessSession,
  buildWrongsSession,
  getDailySessionKey,
  removeSession,
  upsertSession,
} from "@/lib/holdem/sessions";
import { loadStore, saveStore } from "@/lib/holdem/store";
import type {
  Feedback,
  Session,
  Settings,
  Store,
  Summary,
  WrongFilter,
} from "@/lib/holdem/types";
import { registerServiceWorker, triggerFeedback } from "./browser";
import type { HoldemReadyAppActions, HoldemReadyAppState } from "./holdem-ready-model";
import { HoldemReadyAppView } from "./holdem-ready-view";
import { LoadingScreen } from "./screens";

export function HoldemReadyApp() {
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<Store>(createDefaultStore);
  const [view, setView] = useState<HoldemReadyAppState["view"]>("home");
  const [tab, setTab] = useState<HoldemReadyAppState["tab"]>("home");
  const [session, setSession] = useState<Session | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wrongFilter, setWrongFilter] = useState<WrongFilter>("all");

  useEffect(() => {
    queueMicrotask(() => {
      setStore(loadStore());
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveStore(store);
  }, [ready, store]);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  const mutateStore = (updater: (current: Store) => Store) => {
    setStore((current) => updater(current));
  };

  const openTab: HoldemReadyAppActions["openTab"] = (next) => {
    setTab(next);
    setView(next);
    setSession(null);
    setFeedback(null);
    setSummary(null);
  };

  const beginSession = (nextSession: Session | null) => {
    if (!nextSession) return;

    mutateStore((current) => upsertSession(current, nextSession));
    setSession(nextSession);
    setFeedback(null);
    setSummary(null);
    setView("quiz");
  };

  const startDaily = () => {
    const dailySession = store.sessions[getDailySessionKey()];

    if (dailySession && dailySession.index < dailySession.questionIds.length) {
      setSession(dailySession);
      setFeedback(null);
      setSummary(null);
      setView("quiz");
      return;
    }

    beginSession(buildDailySession(store.responses));
  };

  const openLiveTips = () => {
    setTab("home");
    setSession(null);
    setFeedback(null);
    setSummary(null);
    setView("liveTips");
  };

  const startWrongs = (category?: TrainingCategory) => {
    beginSession(buildWrongsSession(store.responses, category));
  };

  const startWeakness = (tag: string) => {
    beginSession(buildWeaknessSession(tag));
  };

  const answer: HoldemReadyAppActions["answer"] = (choice) => {
    const currentQuestion = session && session.index < session.questionIds.length
      ? QUESTIONS_BY_ID[session.questionIds[session.index]]
      : null;

    if (!session || !currentQuestion || feedback) return;

    const result = answerSessionQuestion({
      store,
      session,
      question: currentQuestion,
      choice,
    });

    setStore(result.nextStore);
    setSession(result.nextSession);
    setFeedback(result.feedback);
    triggerFeedback(store.settings, result.feedback.correct);
  };

  const next = () => {
    if (!session) return;

    if (feedback && session.index >= session.questionIds.length) {
      setSummary({
        label: session.label,
        total: session.results.length,
        correct: session.results.filter((entry) => entry.correct).length,
      });
      setFeedback(null);
      mutateStore((current) => removeSession(current, session.key));
      return;
    }

    setFeedback(null);
  };

  const toggleTip = (tipId: string) => {
    mutateStore((current) => ({
      ...current,
      tipChecks: {
        ...current.tipChecks,
        [tipId]: !current.tipChecks[tipId],
      },
    }));
  };

  const updateSettings = (partial: Partial<Settings>) => {
    mutateStore((current) => ({
      ...current,
      settings: {
        ...current.settings,
        ...partial,
      },
    }));
  };

  const resetAll = () => {
    if (typeof window !== "undefined" && !window.confirm("학습 데이터와 체크리스트를 모두 초기화할까요?")) {
      return;
    }

    setStore(createDefaultStore());
    setSession(null);
    setFeedback(null);
    setSummary(null);
    setSettingsOpen(false);
    setWrongFilter("all");
    setTab("home");
    setView("home");
  };

  if (!ready) {
    return <LoadingScreen />;
  }

  const state: HoldemReadyAppState = {
    store,
    view,
    tab,
    session,
    feedback,
    summary,
    settingsOpen,
    wrongFilter,
  };

  const actions: HoldemReadyAppActions = {
    openTab,
    setSettingsOpen,
    startDaily,
    openLiveTips,
    startWrongs,
    startWeakness,
    answer,
    next,
    toggleTip,
    updateSettings,
    resetAll,
    exitQuiz: () => {
      setSession(null);
      setFeedback(null);
      setSummary(null);
      setView(tab);
    },
    setWrongFilter,
    reviewWrong: (questionId: string) => {
      beginSession(buildSingleQuestionSession(questionId));
    },
  };

  return <HoldemReadyAppView state={state} actions={actions} />;
}
