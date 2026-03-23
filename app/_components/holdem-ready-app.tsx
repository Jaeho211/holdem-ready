"use client";

import { useEffect, useState } from "react";
import {
  questionBank,
  type AppTrainingCategory,
  type AnswerChoice,
  type TrainingCategory,
} from "@/lib/training-data";
import { createDefaultStore } from "@/lib/holdem/constants";
import { QUESTIONS_BY_ID } from "@/lib/holdem/questions";
import {
  getCategoryAccuracy,
  getOverallAccuracy,
  getStreak,
  getTodayCount,
  getTrend,
  getWeaknesses,
  getWrongEntries,
} from "@/lib/holdem/selectors";
import {
  answerSessionQuestion,
  buildCategorySession,
  buildDailySession,
  buildWeaknessSession,
  buildWrongsSession,
  getDailySessionKey,
  removeSession,
  upsertSession,
} from "@/lib/holdem/sessions";
import { loadStore, saveStore } from "@/lib/holdem/store";
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
import { registerServiceWorker, triggerFeedback } from "./browser";
import { cn } from "./ui";
import {
  AppHeader,
  BottomNav,
  HomeScreen,
  LiveTipsScreen,
  LoadingScreen,
  QuizScreen,
  RecordsScreen,
  SettingsModal,
  TrainingScreen,
  type TrainingCardViewModel,
  WrongsScreen,
} from "./screens";

const TRAINING_CATEGORIES: ReadonlyArray<TrainingCategory> = [
  "preflop",
  "postflop",
  "odds",
];

export function HoldemReadyApp() {
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<Store>(createDefaultStore);
  const [view, setView] = useState<AppView>("home");
  const [tab, setTab] = useState<AppTab>("home");
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

  const dailySessionKey = getDailySessionKey();
  const dailySession = store.sessions[dailySessionKey];
  const todayCount = getTodayCount(store.responses);
  const weakTags = getWeaknesses(store.responses);
  const missed = getWrongEntries(store.responses, wrongFilter);
  const currentQuestion = feedback
    ? QUESTIONS_BY_ID[feedback.questionId]
    : session && session.index < session.questionIds.length
      ? QUESTIONS_BY_ID[session.questionIds[session.index]]
      : null;
  const tipCheckedCount = Object.values(store.tipChecks).filter(Boolean).length;

  const trainingCards: TrainingCardViewModel[] = TRAINING_CATEGORIES.map((category) => {
    const active = store.sessions[`category:${category}`];

    return {
      category,
      questionCount: questionBank.filter((question) => question.category === category).length,
      accuracy: getCategoryAccuracy(store.responses, category),
      progress:
        active && active.index < active.questionIds.length
          ? `${active.index}/${active.questionIds.length}`
          : "--",
      hasActiveSession: Boolean(active && active.index < active.questionIds.length),
    };
  });

  const categoryAccuracies = {
    preflop: getCategoryAccuracy(store.responses, "preflop"),
    postflop: getCategoryAccuracy(store.responses, "postflop"),
    odds: getCategoryAccuracy(store.responses, "odds"),
  };

  const mutateStore = (updater: (current: Store) => Store) => {
    setStore((current) => updater(current));
  };

  const openTab = (next: AppTab) => {
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
    if (dailySession && dailySession.index < dailySession.questionIds.length) {
      setSession(dailySession);
      setFeedback(null);
      setSummary(null);
      setView("quiz");
      return;
    }

    beginSession(buildDailySession());
  };

  const startCategory = (category: AppTrainingCategory, useExisting = false) => {
    if (category === "liveTips") {
      setTab("training");
      setSession(null);
      setFeedback(null);
      setSummary(null);
      setView("liveTips");
      return;
    }

    const existing = store.sessions[`category:${category}`];
    if (useExisting && existing && existing.index < existing.questionIds.length) {
      setSession(existing);
      setFeedback(null);
      setSummary(null);
      setView("quiz");
      return;
    }

    beginSession(buildCategorySession(category));
  };

  const startWrongs = (category?: TrainingCategory) => {
    beginSession(buildWrongsSession(store.responses, category));
  };

  const startWeakness = (tag: string) => {
    beginSession(buildWeaknessSession(tag));
  };

  const answer = (choice: AnswerChoice) => {
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

  return (
    <main
      className={cn(
        "relative z-10 mx-auto flex w-full max-w-[520px] flex-col",
        view === "quiz"
          ? "min-h-[100svh] overflow-hidden px-0 pb-0 pt-0"
          : "min-h-screen px-4 pb-28 pt-4 sm:px-5",
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 rounded-b-[48px] bg-[radial-gradient(circle_at_top,rgba(214,186,122,0.18),transparent_68%)]" />
      <div className={cn("flex-1", view === "quiz" && "min-h-0")}>
        {view !== "quiz" && <AppHeader view={view} onOpenSettings={() => setSettingsOpen(true)} />}

        {view === "home" && (
          <HomeScreen
            todayCount={todayCount}
            dailyGoal={store.settings.dailyGoal}
            hasActiveDailySession={Boolean(dailySession && dailySession.index < dailySession.questionIds.length)}
            weakTags={weakTags}
            streakDays={getStreak(store.responses)}
            wrongsAvailable={Boolean(getWrongEntries(store.responses, "all").length)}
            tipCheckedCount={tipCheckedCount}
            onStartDaily={startDaily}
            onStartWrongs={() => startWrongs()}
            onStartWeakness={startWeakness}
            onStartCategory={startCategory}
          />
        )}

        {view === "training" && (
          <TrainingScreen cards={trainingCards} onStartCategory={startCategory} />
        )}

        {view === "wrongs" && (
          <WrongsScreen
            wrongFilter={wrongFilter}
            missed={missed}
            onFilterChange={setWrongFilter}
            onStartWrongs={() => startWrongs()}
            onStartWeakness={startWeakness}
          />
        )}

        {view === "records" && (
          <RecordsScreen
            overallAccuracy={getOverallAccuracy(store.responses)}
            streakDays={getStreak(store.responses)}
            totalResponses={store.responses.length}
            categoryAccuracies={categoryAccuracies}
            trend={getTrend(store.responses)}
            weakTags={weakTags}
            onStartWeakness={startWeakness}
          />
        )}

        {view === "liveTips" && (
          <LiveTipsScreen
            tipChecks={store.tipChecks}
            onToggleTip={toggleTip}
            onBack={() => openTab("training")}
          />
        )}

        {view === "quiz" && session && (
          <QuizScreen
            session={session}
            summary={summary}
            currentQuestion={currentQuestion}
            feedback={feedback}
            onExit={() => {
              setSession(null);
              setFeedback(null);
              setSummary(null);
              setView(tab);
            }}
            onAnswer={answer}
            onStartWeakness={startWeakness}
            onNext={next}
            onOpenHome={() => openTab("home")}
            onOpenRecords={() => openTab("records")}
          />
        )}
      </div>

      {view !== "quiz" && <BottomNav tab={tab} onOpenTab={openTab} />}

      {settingsOpen && (
        <SettingsModal
          settings={store.settings}
          onClose={() => setSettingsOpen(false)}
          onUpdateSettings={updateSettings}
          onReset={resetAll}
        />
      )}
    </main>
  );
}
