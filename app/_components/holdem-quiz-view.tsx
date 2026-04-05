"use client";

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
import { getDailySessionKey } from "@/lib/holdem/sessions";
import type { HoldemQuizAppActions, HoldemQuizAppState } from "./holdem-quiz-model";
import { HOLDEM_QUIZ_NOOP_ACTIONS } from "./holdem-quiz-model";
import {
  AppHeader,
  BottomNav,
  HomeScreen,
  LiveTipsScreen,
  QuizScreen,
  RecordsScreen,
  SettingsModal,
  WrongsScreen,
} from "./screens";
import { cn } from "./ui";

export function HoldemQuizAppView({
  state,
  actions = HOLDEM_QUIZ_NOOP_ACTIONS,
}: {
  state: HoldemQuizAppState;
  actions?: HoldemQuizAppActions;
}) {
  const now = state.nowIso ? new Date(state.nowIso) : new Date();
  const dailySessionKey = getDailySessionKey(now);
  const dailySession = state.store.sessions[dailySessionKey];
  const todayCount = getTodayCount(state.store.responses, now);
  const weakTags = getWeaknesses(state.store.responses);
  const hasWeaknessHistory = state.store.responses.some((entry) => !entry.correct);
  const missed = getWrongEntries(state.store.responses, state.wrongFilter);
  const currentQuestion = state.feedback
    ? QUESTIONS_BY_ID[state.feedback.questionId]
    : state.session && state.session.index < state.session.questionIds.length
      ? QUESTIONS_BY_ID[state.session.questionIds[state.session.index]]
      : null;
  const tipCheckedCount = Object.values(state.store.tipChecks).filter(Boolean).length;

  const categoryAccuracies = {
    preflop: getCategoryAccuracy(state.store.responses, "preflop"),
    postflop: getCategoryAccuracy(state.store.responses, "postflop"),
    odds: getCategoryAccuracy(state.store.responses, "odds"),
  };

  return (
    <main
      data-qa-root="app"
      className={cn(
        "relative z-10 mx-auto flex w-full max-w-[520px] flex-col",
        state.view === "quiz"
          ? "min-h-[100svh] overflow-hidden px-0 pb-0 pt-0"
          : "min-h-screen px-4 pb-28 pt-4 sm:px-5",
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 rounded-b-[48px] bg-[radial-gradient(circle_at_top,rgba(214,186,122,0.18),transparent_68%)]" />
      <div className={cn("flex-1", state.view === "quiz" && "min-h-0")}>
        {state.view !== "quiz" && (
          <AppHeader view={state.view} onOpenSettings={() => actions.setSettingsOpen(true)} />
        )}

        {state.view === "home" && (
          <HomeScreen
            todayCount={todayCount}
            dailyGoal={state.store.settings.dailyGoal}
            hasActiveDailySession={Boolean(dailySession && dailySession.index < dailySession.questionIds.length)}
            hasWeaknessHistory={hasWeaknessHistory}
            weakTags={weakTags}
            streakDays={getStreak(state.store.responses, now)}
            wrongsAvailable={Boolean(getWrongEntries(state.store.responses, "all").length)}
            tipCheckedCount={tipCheckedCount}
            onStartDaily={actions.startDaily}
            onStartWrongs={() => actions.startWrongs()}
            onOpenLiveTips={actions.openLiveTips}
            onStartWeakness={actions.startWeakness}
          />
        )}

        {state.view === "wrongs" && (
          <WrongsScreen
            wrongFilter={state.wrongFilter}
            missed={missed}
            onFilterChange={actions.setWrongFilter}
            onStartWrongs={() => actions.startWrongs()}
            onStartWeakness={actions.startWeakness}
            onReviewWrong={actions.reviewWrong}
          />
        )}

        {state.view === "records" && (
          <RecordsScreen
            overallAccuracy={getOverallAccuracy(state.store.responses)}
            streakDays={getStreak(state.store.responses, now)}
            totalResponses={state.store.responses.length}
            categoryAccuracies={categoryAccuracies}
            trend={getTrend(state.store.responses, now)}
            responses={state.store.responses}
            onReviewQuestion={actions.reviewQuestion}
          />
        )}

        {state.view === "liveTips" && (
          <LiveTipsScreen
            tipChecks={state.store.tipChecks}
            onToggleTip={actions.toggleTip}
            onBack={() => actions.openTab("home")}
          />
        )}

        {state.view === "quiz" && state.session && (
          <QuizScreen
            session={state.session}
            summary={state.summary}
            currentQuestion={currentQuestion}
            feedback={state.feedback}
            onExit={actions.exitQuiz}
            onAnswer={actions.answer}
            onNext={actions.next}
            onOpenHome={() => actions.openTab("home")}
            onOpenRecords={() => actions.openTab("records")}
          />
        )}
      </div>

      {state.view !== "quiz" && <BottomNav tab={state.tab} onOpenTab={actions.openTab} />}

      {state.settingsOpen && (
        <SettingsModal
          settings={state.store.settings}
          onClose={() => actions.setSettingsOpen(false)}
          onUpdateSettings={actions.updateSettings}
          onReset={actions.resetAll}
          onExportBackup={actions.exportBackup}
          onImportBackup={actions.importBackup}
        />
      )}
    </main>
  );
}
