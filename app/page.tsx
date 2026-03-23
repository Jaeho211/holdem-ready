"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  categoryMeta,
  liveTipSections,
  questionBank,
  type AppTrainingCategory,
  type AnswerChoice,
  type HoldemQuestion,
  type TrainingCategory,
} from "@/lib/training-data";

type View = "home" | "training" | "wrongs" | "records" | "liveTips" | "quiz";
type Tab = "home" | "training" | "wrongs" | "records";
type Settings = { language: "ko"; vibration: boolean; sound: boolean; dailyGoal: 5 | 10 | 20 };
type ResponseEntry = { questionId: string; category: TrainingCategory; choice: AnswerChoice; correct: boolean; correctChoice: AnswerChoice; answeredAt: string; tags: string[] };
type Session = { key: string; label: string; questionIds: string[]; index: number; results: { questionId: string; choice: AnswerChoice; correct: boolean }[] };
type Store = { settings: Settings; responses: ResponseEntry[]; tipChecks: Record<string, boolean>; sessions: Record<string, Session> };
type Feedback = { questionId: string; choice: AnswerChoice; correct: boolean; questionNumber: number };
type Summary = { label: string; total: number; correct: number };

const KEY = "holdem-ready:v1";
const ACTIONS = [
  { value: "fold", label: "Fold" },
  { value: "call", label: "Call" },
  { value: "raise", label: "Raise" },
] as const;
const CATEGORY_SIZE: Record<TrainingCategory, number> = { preflop: 8, postflop: 6, odds: 5 };
const FALLBACK_WEAKNESSES = ["SB 디펜스", "탑페어 운영", "포트 오즈"];
const TIP_TOTAL = liveTipSections.reduce((sum, section) => sum + section.items.length, 0);
const QUESTIONS = Object.fromEntries(questionBank.map((question) => [question.id, question])) as Record<string, HoldemQuestion>;
const DEFAULT_STORE: Store = {
  settings: { language: "ko", vibration: true, sound: false, dailyGoal: 10 },
  responses: [],
  tipChecks: {},
  sessions: {},
};

let audioContext: AudioContext | null = null;

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");
const dayKey = (date: Date) => `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};
const shuffle = <T,>(items: T[]) => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};
const loadStore = (): Store => {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STORE;
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      settings: { ...DEFAULT_STORE.settings, ...(parsed.settings ?? {}) },
      responses: Array.isArray(parsed.responses) ? parsed.responses : [],
      tipChecks: parsed.tipChecks && typeof parsed.tipChecks === "object" ? parsed.tipChecks : {},
      sessions: parsed.sessions && typeof parsed.sessions === "object" ? parsed.sessions : {},
    };
  } catch {
    return DEFAULT_STORE;
  }
};
const choiceLabel = (question: HoldemQuestion, choice: AnswerChoice) => {
  if (choice === "fold") return "Fold";
  if (choice === "call") return "Call";
  if (choice === "raise") return "Raise";
  return question.category === "odds" ? question.options.find((option) => option.value === choice)?.label ?? String(choice) : String(choice);
};
const overallAccuracy = (responses: ResponseEntry[]) => responses.length ? Math.round((responses.filter((entry) => entry.correct).length / responses.length) * 100) : 0;
const categoryAccuracy = (responses: ResponseEntry[], category: TrainingCategory) => {
  const entries = responses.filter((entry) => entry.category === category);
  return entries.length ? Math.round((entries.filter((entry) => entry.correct).length / entries.length) * 100) : null;
};
const weaknesses = (responses: ResponseEntry[]) => {
  const counts = new Map<string, number>();
  for (const entry of responses.filter((item) => !item.correct).slice(0, 40)) {
    for (const tag of entry.tags.slice(0, 2)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  const tags = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tag]) => tag);
  return tags.length ? tags : FALLBACK_WEAKNESSES;
};
const wrongEntries = (responses: ResponseEntry[], filter: "all" | TrainingCategory | "liveTips") => {
  if (filter === "liveTips") return [];
  const seen = new Set<string>();
  return responses.filter((entry) => {
    if (entry.correct) return false;
    if (filter !== "all" && entry.category !== filter) return false;
    if (seen.has(entry.questionId)) return false;
    seen.add(entry.questionId);
    return true;
  });
};
const trend = (responses: ResponseEntry[]) => Array.from({ length: 7 }, (_, index) => {
  const date = addDays(new Date(), index - 6);
  const key = dayKey(date);
  return { label: `${date.getMonth() + 1}/${date.getDate()}`, count: responses.filter((entry) => dayKey(new Date(entry.answeredAt)) === key).length };
});
const streak = (responses: ResponseEntry[]) => {
  const days = new Set(responses.map((entry) => dayKey(new Date(entry.answeredAt))));
  let total = 0;
  let cursor = new Date();
  while (days.has(dayKey(cursor))) {
    total += 1;
    cursor = addDays(cursor, -1);
  }
  return total;
};
const playTone = (correct: boolean) => {
  const Context = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) return;
  if (!audioContext) audioContext = new Context();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = correct ? 720 : 320;
  gain.gain.value = 0.018;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + (correct ? 0.08 : 0.14));
};

export default function Page() {
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<Store>(DEFAULT_STORE);
  const [view, setView] = useState<View>("home");
  const [tab, setTab] = useState<Tab>("home");
  const [session, setSession] = useState<Session | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wrongFilter, setWrongFilter] = useState<"all" | TrainingCategory | "liveTips">("all");

  useEffect(() => {
    queueMicrotask(() => {
      setStore(loadStore());
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(KEY, JSON.stringify(store));
  }, [ready, store]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  const todaySessionKey = `daily:${dayKey(new Date())}`;
  const dailySession = store.sessions[todaySessionKey];
  const todayCount = store.responses.filter((entry) => dayKey(new Date(entry.answeredAt)) === dayKey(new Date())).length;
  const weakTags = weaknesses(store.responses);
  const missed = wrongEntries(store.responses, wrongFilter);
  const currentQuestion = feedback ? QUESTIONS[feedback.questionId] : session && session.index < session.questionIds.length ? QUESTIONS[session.questionIds[session.index]] : null;

  const mutateStore = (updater: (current: Store) => Store) => setStore((current) => updater(current));
  const openTab = (next: Tab) => { setTab(next); setView(next); setSession(null); setFeedback(null); setSummary(null); };
  const beginSession = (next: Session) => {
    mutateStore((current) => ({ ...current, sessions: { ...current.sessions, [next.key]: next } }));
    setSession(next);
    setFeedback(null);
    setSummary(null);
    setView("quiz");
  };
  const makeSession = (key: string, label: string, ids: string[]): Session => ({ key, label, questionIds: Array.from(new Set(ids)), index: 0, results: [] });
  const startDaily = () => {
    if (dailySession && dailySession.index < dailySession.questionIds.length) {
      setSession(dailySession);
      setView("quiz");
      return;
    }
    beginSession(makeSession(todaySessionKey, "오늘의 10문제", shuffle(questionBank.map((question) => question.id)).slice(0, 10)));
  };
  const startCategory = (category: AppTrainingCategory, useExisting = false) => {
    if (category === "liveTips") {
      setTab("training");
      setView("liveTips");
      return;
    }
    const key = `category:${category}`;
    const existing = store.sessions[key];
    if (useExisting && existing && existing.index < existing.questionIds.length) {
      setSession(existing);
      setView("quiz");
      return;
    }
    beginSession(makeSession(key, categoryMeta[category].label, shuffle(questionBank.filter((question) => question.category === category).map((question) => question.id)).slice(0, CATEGORY_SIZE[category])));
  };
  const startWrongs = (category?: TrainingCategory) => {
    const ids = shuffle(wrongEntries(store.responses, category ?? "all").map((entry) => entry.questionId)).slice(0, 10);
    if (!ids.length) return;
    beginSession(makeSession(category ? `wrongs:${category}` : "wrongs:all", category ? `${categoryMeta[category].label} 오답 복습` : "최근 오답 다시 풀기", ids));
  };
  const startWeakness = (tag: string) => beginSession(makeSession(`weak:${tag}`, `${tag} 5문제`, (() => {
    const ids = shuffle(questionBank.filter((question) => question.tags.includes(tag)).map((question) => question.id)).slice(0, 5);
    return ids.length ? ids : shuffle(questionBank.map((question) => question.id)).slice(0, 5);
  })()));
  const answer = (choice: AnswerChoice) => {
    if (!session || !currentQuestion || feedback) return;
    const correct = choice === currentQuestion.correct;
    const nextSession: Session = { ...session, index: session.index + 1, results: [...session.results, { questionId: currentQuestion.id, choice, correct }] };
    mutateStore((current) => ({
      ...current,
      responses: [{ questionId: currentQuestion.id, category: currentQuestion.category, choice, correct, correctChoice: currentQuestion.correct, answeredAt: new Date().toISOString(), tags: currentQuestion.tags }, ...current.responses].slice(0, 500),
      sessions: { ...current.sessions, [nextSession.key]: nextSession },
    }));
    setSession(nextSession);
    setFeedback({ questionId: currentQuestion.id, choice, correct, questionNumber: session.index + 1 });
    if (store.settings.vibration && "vibrate" in navigator) navigator.vibrate(correct ? 20 : [60, 40, 60]);
    if (store.settings.sound) playTone(correct);
  };
  const next = () => {
    if (!session) return;
    if (feedback && session.index >= session.questionIds.length) {
      setSummary({ label: session.label, total: session.results.length, correct: session.results.filter((entry) => entry.correct).length });
      setFeedback(null);
      mutateStore((current) => {
        const sessions = { ...current.sessions };
        delete sessions[session.key];
        return { ...current, sessions };
      });
      return;
    }
    setFeedback(null);
  };
  const toggleTip = (id: string) => mutateStore((current) => ({ ...current, tipChecks: { ...current.tipChecks, [id]: !current.tipChecks[id] } }));
  const updateSettings = (partial: Partial<Settings>) => mutateStore((current) => ({ ...current, settings: { ...current.settings, ...partial } }));
  const resetAll = () => {
    if (!window.confirm("학습 데이터와 체크리스트를 모두 초기화할까요?")) return;
    setStore(DEFAULT_STORE);
    setSession(null);
    setFeedback(null);
    setSummary(null);
    setSettingsOpen(false);
    setWrongFilter("all");
    setTab("home");
    setView("home");
  };

  if (!ready) {
    return (
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[520px] items-center justify-center px-5 py-10">
        <Surface><p className="text-xs uppercase tracking-[0.28em] text-[#d7b977]">Holdem Ready</p><h1 className="mt-3 font-serif text-3xl text-[#f6efe0]">모바일 학습 테이블 준비 중</h1></Surface>
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[520px] flex-col px-4 pb-28 pt-4 sm:px-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 rounded-b-[48px] bg-[radial-gradient(circle_at_top,rgba(214,186,122,0.18),transparent_68%)]" />
      <div className="flex-1">
        {view !== "quiz" && (
          <header className="mb-5 animate-rise">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#d7b977]">Holdem Ready</p>
                <h1 className="mt-2 font-serif text-[2rem] leading-none text-[#f8f1de]">{view === "home" ? "라스베가스 대비" : view === "training" ? "훈련 선택" : view === "wrongs" ? "오답노트" : view === "records" ? "내 기록" : "라이브 카지노 팁"}</h1>
                <p className="mt-2 text-sm leading-6 text-[#efe2be]/78">{view === "home" ? "짧은 실전 문제와 오답 보정으로 라이브 감각을 올립니다." : view === "training" ? "프리플랍, 포스트플랍, 확률, 현장 적응을 모바일 흐름에 맞게 반복하세요." : view === "wrongs" ? "최근에 틀린 문제를 다시 모아 약한 결정만 빠르게 복습합니다." : view === "records" ? "정답률, 약점, 최근 학습 흐름을 한 번에 봅니다." : "테이블 적응을 체크리스트형 카드로 정리합니다."}</p>
              </div>
              <button type="button" onClick={() => setSettingsOpen(true)} className="rounded-full border border-[#d7b977]/20 bg-white/6 p-3 text-[#f6efe0] shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur" aria-label="설정 열기">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]"><path d="M12 8.7a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Z" /><path d="m19.4 15-.8 1.4 1.2 2.1-2.1 2.1-2.1-1.2-1.4.8-.6 2.4h-3l-.6-2.4-1.4-.8-2.1 1.2-2.1-2.1 1.2-2.1-.8-1.4L2 12l2.4-.6.8-1.4-1.2-2.1 2.1-2.1 2.1 1.2 1.4-.8.6-2.4h3l.6 2.4 1.4.8 2.1-1.2 2.1 2.1-1.2 2.1.8 1.4L22 12Z" /></svg>
              </button>
            </div>
          </header>
        )}

        {view === "home" && (
          <section className="space-y-4">
            <Surface>
              <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(215,185,119,0.22),transparent_66%)]" />
              <div className="relative flex items-center gap-4">
                <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border border-[#d7b977]/20 bg-[#061d16]" style={{ backgroundImage: `conic-gradient(#d7b977 ${Math.min(todayCount / store.settings.dailyGoal, 1) * 360}deg, rgba(255,255,255,0.08) 0deg)` }}><div className="grid h-[4.7rem] w-[4.7rem] place-items-center rounded-full bg-[#09251d] text-center"><div><p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#d7b977]">Today</p><p className="mt-1 text-2xl font-semibold text-[#f6efe0]">{todayCount}</p></div></div></div>
                <div>
                  <p className="text-sm text-[#f6efe0]/70">오늘 목표 {store.settings.dailyGoal}문제 중 {todayCount}문제 완료</p>
                  <h2 className="mt-1 font-serif text-2xl text-[#fbf6ea]">{dailySession && dailySession.index < dailySession.questionIds.length ? "오늘 세션 이어서 가기" : "오늘의 10문제로 시작"}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#efe2be]/80">{weakTags[0]}{weakTags[1] ? `, ${weakTags[1]}` : ""} 쪽에서 가장 많이 미끄러집니다.</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#efe2be]"><span className="rounded-full border border-[#d7b977]/16 bg-[#09231b] px-3 py-2">연속 {streak(store.responses)}일</span><span className="rounded-full border border-[#d7b977]/16 bg-[#09231b] px-3 py-2">약점 {weakTags[0]}</span></div>
                </div>
              </div>
              <div className="relative mt-5 flex flex-col gap-3 sm:flex-row"><Primary onClick={startDaily}>{dailySession && dailySession.index < dailySession.questionIds.length ? "오늘의 10문제 이어풀기" : "오늘의 10문제 시작"}</Primary><Secondary onClick={() => startWrongs()} disabled={!wrongEntries(store.responses, "all").length}>최근 오답 다시</Secondary></div>
            </Surface>
            <div className="grid gap-4 sm:grid-cols-2">
              <Surface><CardEyebrow>약점 추적</CardEyebrow><h3 className="mt-2 font-serif text-2xl text-[#f6efe0]">약한 영역 drill</h3><p className="mt-2 text-sm leading-6 text-[#efe2be]/80">지금 가장 흔들리는 영역을 5문제로 끊어 바로 복습합니다.</p><div className="mt-4 flex items-end justify-between gap-3"><div><p className="text-lg font-medium text-[#f8f1de]">{weakTags[0]}</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#d7b977]">Weakest Now</p></div><Secondary onClick={() => startWeakness(weakTags[0])}>5문제 시작</Secondary></div></Surface>
              <Surface><CardEyebrow>빠른 메모</CardEyebrow><h3 className="mt-2 font-serif text-2xl text-[#f6efe0]">라이브 팁 진행도</h3><p className="mt-2 text-sm leading-6 text-[#efe2be]/80">체크리스트형으로 현장 적응 포인트를 관리합니다.</p><div className="mt-4 flex items-end justify-between gap-3"><div><p className="text-3xl font-semibold text-[#f8f1de]">{Object.values(store.tipChecks).filter(Boolean).length}/{TIP_TOTAL}</p><p className="text-xs uppercase tracking-[0.18em] text-[#d7b977]">Live Tips</p></div><Secondary onClick={() => startCategory("liveTips")}>팁 열기</Secondary></div></Surface>
            </div>
            <Surface>
              <div className="flex items-center justify-between gap-3"><div><CardEyebrow>빠른 진입</CardEyebrow><h3 className="mt-2 font-serif text-2xl text-[#f6efe0]">바로 훈련 들어가기</h3></div></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Quick title="프리플랍" subtitle="핸드와 포지션" tone="emerald" onClick={() => startCategory("preflop")} />
                <Quick title="포스트플랍" subtitle="탑페어와 드로우" tone="amber" onClick={() => startCategory("postflop")} />
                <Quick title="확률" subtitle="아웃과 포트 오즈" tone="sky" onClick={() => startCategory("odds")} />
                <Quick title="라이브 팁" subtitle="테이블 매너" tone="rose" onClick={() => startCategory("liveTips")} />
              </div>
            </Surface>
          </section>
        )}

        {view === "training" && (
          <section className="space-y-4">
            {(["preflop", "postflop", "odds"] as TrainingCategory[]).map((category) => {
              const active = store.sessions[`category:${category}`];
              return (
                <Surface key={category}>
                  <div className="flex items-start justify-between gap-4"><div><CardEyebrow>{categoryMeta[category].difficulty}</CardEyebrow><h2 className="mt-2 font-serif text-[1.85rem] text-[#fbf5e6]">{categoryMeta[category].label}</h2><p className="mt-2 text-sm leading-6 text-[#efe2be]/80">{categoryMeta[category].description}</p></div><span className="rounded-full border border-[#d7b977]/20 bg-[#091f18] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[#d7b977]">{categoryMeta[category].emphasis}</span></div>
                  <div className="mt-5 grid grid-cols-3 gap-3 text-center"><Metric label="문제 수" value={`${questionBank.filter((question) => question.category === category).length}`} /><Metric label="최근 정답률" value={categoryAccuracy(store.responses, category) !== null ? `${categoryAccuracy(store.responses, category)}%` : "--"} /><Metric label="이어풀기" value={active && active.index < active.questionIds.length ? `${active.index}/${active.questionIds.length}` : "--"} /></div>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row"><Primary onClick={() => startCategory(category, true)}>{active && active.index < active.questionIds.length ? "이어풀기" : "빠른 시작"}</Primary><Secondary onClick={() => startCategory(category)}>새로 시작</Secondary></div>
                </Surface>
              );
            })}
            <Surface><CardEyebrow>현장 적응</CardEyebrow><h2 className="mt-2 font-serif text-[1.85rem] text-[#fbf5e6]">라이브 카지노 팁</h2><p className="mt-2 text-sm leading-6 text-[#efe2be]/80">테이블 앉기, 바잉, 액션 순서, 베팅 선언 같은 현장 포인트를 체크리스트로 훑습니다.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><Primary onClick={() => startCategory("liveTips")}>체크리스트 열기</Primary><Secondary onClick={() => startCategory("liveTips")}>처음부터 보기</Secondary></div></Surface>
          </section>
        )}
        {view === "wrongs" && (
          <section className="space-y-4">
            <Surface><div className="flex items-center justify-between gap-4"><div><CardEyebrow>필터</CardEyebrow><h2 className="mt-2 font-serif text-2xl text-[#f6efe0]">카테고리별 오답 확인</h2></div><Secondary onClick={() => startWrongs()} disabled={!wrongEntries(store.responses, "all").length}>오답 10문제</Secondary></div><div className="mt-4 flex flex-wrap gap-2">{([{ key: "all", label: "전체" }, { key: "preflop", label: "프리플랍" }, { key: "postflop", label: "포스트플랍" }, { key: "odds", label: "확률" }, { key: "liveTips", label: "라이브 팁" }] as const).map((item) => <button key={item.key} type="button" onClick={() => setWrongFilter(item.key)} className={cn("rounded-full px-4 py-2 text-sm transition", wrongFilter === item.key ? "bg-[#d7b977] text-[#172016]" : "border border-[#d7b977]/16 bg-[#09231b] text-[#efe2be]")}>{item.label}</button>)}</div></Surface>
            {missed.length ? missed.map((entry) => { const question = QUESTIONS[entry.questionId]; return <Surface key={`${entry.questionId}-${entry.answeredAt}`}><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] uppercase tracking-[0.2em] text-[#d7b977]">{categoryMeta[question.category].shortLabel}</p><h3 className="mt-2 font-serif text-xl text-[#f6efe0]">{question.title}</h3><p className="mt-2 text-sm leading-6 text-[#efe2be]/78">{question.pitfall}</p></div><span className="rounded-full border border-[#d56262]/30 bg-[#3b1b1d]/60 px-3 py-2 text-xs uppercase tracking-[0.18em] text-[#f2b4b4]">Miss</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Metric label="내 선택" value={choiceLabel(question, entry.choice)} /><Metric label="정답" value={choiceLabel(question, question.correct)} /></div><div className="mt-4 flex flex-wrap gap-2">{question.tags.map((tag) => <button key={tag} type="button" onClick={() => startWeakness(tag)} className="rounded-full border border-[#d7b977]/20 bg-[#0b251c] px-3 py-2 text-xs text-[#efe2be]">{tag}</button>)}</div></Surface>; }) : <Surface><h3 className="font-serif text-2xl text-[#f6efe0]">{wrongFilter === "liveTips" ? "라이브 팁은 체크리스트형입니다" : "아직 오답이 없습니다"}</h3><p className="mt-3 text-sm leading-6 text-[#efe2be]/78">{wrongFilter === "liveTips" ? "현장 적응은 훈련 탭의 라이브 팁에서 체크리스트로 관리합니다." : "문제를 풀기 시작하면 틀린 문제와 약한 태그가 이곳에 쌓입니다."}</p></Surface>}
          </section>
        )}

        {view === "records" && (
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3"><Surface><CardEyebrow>전체</CardEyebrow><p className="mt-2 text-4xl font-semibold text-[#f8f1de]">{overallAccuracy(store.responses)}%</p><p className="mt-2 text-sm text-[#efe2be]/78">전체 정답률</p></Surface><Surface><CardEyebrow>연속 학습</CardEyebrow><p className="mt-2 text-4xl font-semibold text-[#f8f1de]">{streak(store.responses)}일</p><p className="mt-2 text-sm text-[#efe2be]/78">최근 학습 흐름</p></Surface><Surface><CardEyebrow>누적</CardEyebrow><p className="mt-2 text-4xl font-semibold text-[#f8f1de]">{store.responses.length}</p><p className="mt-2 text-sm text-[#efe2be]/78">총 푼 문제 수</p></Surface></div>
            <Surface><CardEyebrow>카테고리별</CardEyebrow><h2 className="mt-2 font-serif text-2xl text-[#f6efe0]">현재 정확도 분포</h2><div className="mt-4 grid gap-3 sm:grid-cols-3">{(["preflop", "postflop", "odds"] as TrainingCategory[]).map((category) => <Metric key={category} label={categoryMeta[category].shortLabel} value={categoryAccuracy(store.responses, category) !== null ? `${categoryAccuracy(store.responses, category)}%` : "--"} />)}</div></Surface>
            <Surface><CardEyebrow>최근 7일</CardEyebrow><h2 className="mt-2 font-serif text-2xl text-[#f6efe0]">학습 빈도</h2><div className="mt-5 grid grid-cols-7 items-end gap-2">{trend(store.responses).map((entry) => <div key={entry.label} className="text-center"><div className="mx-auto w-full rounded-t-[14px] bg-gradient-to-t from-[#d7b977] to-[#f5deb1]" style={{ height: Math.max(entry.count * 16, 14) }} /><p className="mt-2 text-[11px] text-[#efe2be]/70">{entry.label}</p></div>)}</div></Surface>
            <Surface><CardEyebrow>추천 학습</CardEyebrow><h2 className="mt-2 font-serif text-2xl text-[#f6efe0]">지금 바로 붙들 약점 3개</h2><div className="mt-4 space-y-3">{weakTags.map((tag) => <div key={tag} className="flex items-center justify-between gap-3 rounded-[20px] border border-[#d7b977]/18 bg-[#0a241c] px-4 py-3"><div><p className="text-sm uppercase tracking-[0.18em] text-[#d7b977]">Weak Spot</p><p className="mt-1 text-lg font-medium text-[#f8f1de]">{tag}</p></div><Secondary onClick={() => startWeakness(tag)}>지금 5문제</Secondary></div>)}</div></Surface>
          </section>
        )}

        {view === "liveTips" && (
          <section className="space-y-4">
            <Surface><div className="flex items-center justify-between gap-3"><div><CardEyebrow>체크리스트</CardEyebrow><h2 className="mt-2 font-serif text-2xl text-[#f6efe0]">라스베가스 라이브 적응 포인트</h2></div><div className="rounded-full border border-[#d7b977]/20 bg-[#091f18] px-3 py-2 text-sm text-[#efe2be]">{Object.values(store.tipChecks).filter(Boolean).length}/{TIP_TOTAL}</div></div><p className="mt-3 text-sm leading-6 text-[#efe2be]/78">긴 글 대신 카드 형태로 읽고 바로 체크해 두세요. 현장에서는 전략보다 어색함을 줄이는 것이 체감 효용이 큽니다.</p><div className="mt-4"><Secondary onClick={() => openTab("training")}>훈련 탭으로</Secondary></div></Surface>
            {liveTipSections.map((section) => <Surface key={section.id}><CardEyebrow>{section.subtitle}</CardEyebrow><h3 className="mt-2 font-serif text-2xl text-[#f6efe0]">{section.title}</h3><div className="mt-4 space-y-3">{section.items.map((item) => { const checked = Boolean(store.tipChecks[item.id]); return <button key={item.id} type="button" onClick={() => toggleTip(item.id)} className={cn("flex w-full items-start gap-3 rounded-[22px] border px-4 py-4 text-left transition", checked ? "border-[#2f9f6b]/40 bg-[#113326]" : "border-[#d7b977]/16 bg-[#09231b]")}><span className={cn("mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs", checked ? "border-[#57cb92] bg-[#1d7048] text-[#eaf7ef]" : "border-[#d7b977]/22 text-[#d7b977]")}>{checked ? "OK" : "?"}</span><span><span className="block text-base font-medium text-[#f8f1de]">{item.label}</span><span className="mt-2 block text-sm leading-6 text-[#efe2be]/76">{item.detail}</span></span></button>; })}</div></Surface>)}
          </section>
        )}

        {view === "quiz" && session && (
          <section className="pb-40">
            <header className="sticky top-3 z-20 mb-4 rounded-[26px] border border-[#d7b977]/18 bg-[#061d16]/90 px-4 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl"><div className="flex items-center justify-between gap-3"><button type="button" onClick={() => { setSession(null); setFeedback(null); setSummary(null); setView(tab); }} className="flex items-center gap-2 rounded-full border border-[#d7b977]/18 bg-white/6 px-3 py-2 text-sm text-[#efe2be]"><svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]"><path d="m14 6-6 6 6 6" /><path d="M20 12H8" /></svg>종료</button><div className="text-right"><p className="text-[11px] uppercase tracking-[0.22em] text-[#d7b977]">{summary ? "Session Complete" : currentQuestion ? categoryMeta[currentQuestion.category].shortLabel : "Holdem Ready"}</p><p className="mt-1 text-sm text-[#f6efe0]">{summary ? session.label : `문제 ${feedback ? feedback.questionNumber : session.index + 1} / ${session.questionIds.length}`}</p></div></div></header>
            {summary ? <Surface><CardEyebrow>세션 완료</CardEyebrow><h2 className="mt-2 font-serif text-3xl text-[#f8f1de]">{summary.label}</h2><p className="mt-3 text-sm leading-6 text-[#efe2be]/80">{summary.total}문제 중 {summary.correct}개를 맞혔습니다. 정답률은 {Math.round((summary.correct / Math.max(summary.total, 1)) * 100)}%입니다.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><Metric label="정답" value={`${summary.correct}`} /><Metric label="오답" value={`${summary.total - summary.correct}`} /></div><div className="mt-5 flex flex-col gap-3 sm:flex-row"><Primary onClick={() => openTab("home")}>홈으로</Primary><Secondary onClick={() => openTab("records")}>기록 보기</Secondary></div></Surface> : currentQuestion ? <><Surface><CardEyebrow>{currentQuestion.title}</CardEyebrow><h2 className="mt-2 font-serif text-[2rem] leading-tight text-[#f8f1de]">{currentQuestion.prompt}</h2><div className="mt-4 flex flex-wrap gap-2"><Chip>{currentQuestion.difficulty}</Chip><Chip>{categoryMeta[currentQuestion.category].shortLabel}</Chip>{currentQuestion.tags.map((tag) => <Chip key={tag}>{tag}</Chip>)}</div>{currentQuestion.category === "preflop" && <div className="mt-5 grid gap-3 sm:grid-cols-2"><Metric label="포지션" value={currentQuestion.position} /><Metric label="핸드" value={currentQuestion.hand} /><Metric label="테이블" value={currentQuestion.table} /><Metric label="스택" value={currentQuestion.stack} /><div className="sm:col-span-2"><Metric label="앞선 액션" value={currentQuestion.actionBefore} /></div></div>}{currentQuestion.category === "postflop" && <div className="mt-5 space-y-4"><div><p className="text-[11px] uppercase tracking-[0.22em] text-[#d7b977]">Hero Hand</p><div className="mt-2 flex gap-2">{currentQuestion.holeCards.map((card) => <PlayingCard key={card} card={card} />)}</div></div><div><p className="text-[11px] uppercase tracking-[0.22em] text-[#d7b977]">Board</p><div className="mt-2 flex gap-2">{currentQuestion.board.map((card) => <PlayingCard key={card} card={card} />)}</div></div><div className="grid gap-3 sm:grid-cols-2"><Metric label="팟" value={currentQuestion.pot} /><Metric label="상대 액션" value={currentQuestion.villainBet} /><Metric label="라인" value={currentQuestion.actionBefore} /><Metric label="남은 스택" value={currentQuestion.stack} /></div></div>}{currentQuestion.category === "odds" && <div className="mt-5 space-y-4">{currentQuestion.holeCards && <div><p className="text-[11px] uppercase tracking-[0.22em] text-[#d7b977]">Hero Hand</p><div className="mt-2 flex gap-2">{currentQuestion.holeCards.map((card) => <PlayingCard key={card} card={card} />)}</div></div>}{currentQuestion.board && <div><p className="text-[11px] uppercase tracking-[0.22em] text-[#d7b977]">Board</p><div className="mt-2 flex gap-2">{currentQuestion.board.map((card) => <PlayingCard key={card} card={card} />)}</div></div>}<div className="grid gap-3 sm:grid-cols-2"><Metric label="포커스" value={currentQuestion.mathFocus} /><Metric label="팟" value={currentQuestion.pot} /><Metric label="상대 베팅" value={currentQuestion.villainBet} /><Metric label="상황" value={currentQuestion.actionBefore} /></div></div>}</Surface>{!feedback && <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[520px] px-4 pb-4 sm:px-5"><div className="rounded-[28px] border border-[#d7b977]/20 bg-[#061d16]/96 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl"><p className="px-2 text-[11px] uppercase tracking-[0.22em] text-[#d7b977]">Choose Action</p><div className="mt-3 grid gap-2">{(currentQuestion.category === "odds" ? currentQuestion.options : ACTIONS).map((option) => <button key={option.value} type="button" onClick={() => answer(option.value)} className={cn("w-full rounded-[22px] border px-4 py-4 text-left transition hover:translate-y-[-1px]", currentQuestion.category === "odds" ? "border-[#86c7ff]/18 bg-[#0d2430] text-[#e2f2ff]" : option.value === "fold" ? "border-[#d56262]/18 bg-[#2b1618] text-[#ffe4e4]" : option.value === "call" ? "border-[#7db18f]/18 bg-[#10281e] text-[#e6f8ec]" : "border-[#d7b977]/18 bg-[#2a2210] text-[#fff4dc]")}><span className="block text-base font-semibold">{option.label}</span><span className="mt-1 block text-xs uppercase tracking-[0.18em] opacity-70">{currentQuestion.category === "odds" ? "Math Choice" : "Table Action"}</span></button>)}</div></div></div>}{feedback && <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[520px] px-4 pb-4 sm:px-5"><div className={cn("rounded-[30px] border p-4 shadow-[0_20px_90px_rgba(0,0,0,0.48)] backdrop-blur-xl", feedback.correct ? "border-[#2f9f6b]/45 bg-[#0d2b20]/96" : "border-[#d56262]/36 bg-[#2a1618]/96")}><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] uppercase tracking-[0.22em] text-[#d7b977]">{feedback.correct ? "Correct" : "Not This Time"}</p><h3 className="mt-2 font-serif text-2xl text-[#f8f1de]">추천 액션은 {choiceLabel(currentQuestion, currentQuestion.correct)}</h3></div><span className={cn("rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em]", feedback.correct ? "bg-[#1f6a45] text-[#edf7f1]" : "bg-[#733236] text-[#ffe8e8]")}>{feedback.correct ? "Good Read" : "Leak"}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Metric label="내 선택" value={choiceLabel(currentQuestion, feedback.choice)} /><Metric label="정답" value={choiceLabel(currentQuestion, currentQuestion.correct)} /></div><p className="mt-4 text-sm leading-6 text-[#efe2be]/82">{currentQuestion.explanation}</p><div className="mt-3 rounded-[20px] border border-[#d7b977]/18 bg-black/15 px-4 py-3"><p className="text-[11px] uppercase tracking-[0.22em] text-[#d7b977]">Beginner Leak</p><p className="mt-2 text-sm leading-6 text-[#efe2be]/78">{currentQuestion.pitfall}</p></div><div className="mt-4 flex flex-col gap-3 sm:flex-row"><Secondary onClick={() => startWeakness(currentQuestion.tags[0])}>비슷한 문제 더 풀기</Secondary><Primary onClick={next}>{session.index >= session.questionIds.length ? "세션 결과 보기" : "다음 문제"}</Primary></div></div></div>}</> : null}
          </section>
        )}
      </div>

      {view !== "quiz" && <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[520px] px-4 pb-4 sm:px-5"><div className="grid grid-cols-4 gap-2 rounded-[30px] border border-[#d7b977]/18 bg-[#061d16]/94 p-2 shadow-[0_18px_80px_rgba(0,0,0,0.46)] backdrop-blur-xl">{([{ id: "home", label: "홈" }, { id: "training", label: "훈련" }, { id: "wrongs", label: "오답" }, { id: "records", label: "기록" }] as const).map((item) => <button key={item.id} type="button" onClick={() => openTab(item.id)} className={cn("flex flex-col items-center gap-1 rounded-[22px] px-3 py-3 text-xs transition", tab === item.id ? "bg-[#153a2d] text-[#fbf5e6]" : "text-[#efe2be]/72 hover:bg-white/6")}>{item.label}</button>)}</div></nav>}

      {settingsOpen && <div className="fixed inset-0 z-[60] bg-[#020c09]/72 px-4 py-6 backdrop-blur-sm"><div className="mx-auto mt-8 max-w-[520px] rounded-[32px] border border-[#d7b977]/18 bg-[#071d16]/95 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.5)]"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] uppercase tracking-[0.22em] text-[#d7b977]">Settings</p><h2 className="mt-2 font-serif text-3xl text-[#f6efe0]">앱 설정</h2></div><button type="button" onClick={() => setSettingsOpen(false)} className="rounded-full border border-[#d7b977]/18 bg-white/6 p-3 text-[#f6efe0]" aria-label="설정 닫기"><svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]"><path d="m6 6 12 12M18 6 6 18" /></svg></button></div><div className="mt-5 space-y-4"><SettingRow label="언어" description="MVP에서는 한국어 UI만 제공합니다."><select value={store.settings.language} onChange={(event) => updateSettings({ language: event.target.value as "ko" })} className="rounded-full border border-[#d7b977]/18 bg-[#09231b] px-4 py-3 text-sm text-[#f6efe0]"><option value="ko">한국어</option></select></SettingRow><SettingRow label="진동" description="정답/오답 선택 후 짧은 햅틱 피드백"><Toggle checked={store.settings.vibration} onClick={() => updateSettings({ vibration: !store.settings.vibration })} /></SettingRow><SettingRow label="사운드" description="정답/오답 시 짧은 톤 재생"><Toggle checked={store.settings.sound} onClick={() => updateSettings({ sound: !store.settings.sound })} /></SettingRow><SettingRow label="하루 목표 문제 수" description="홈 대시보드 진행률 기준"><select value={store.settings.dailyGoal} onChange={(event) => updateSettings({ dailyGoal: Number(event.target.value) as Settings["dailyGoal"] })} className="rounded-full border border-[#d7b977]/18 bg-[#09231b] px-4 py-3 text-sm text-[#f6efe0]"><option value={5}>5문제</option><option value={10}>10문제</option><option value={20}>20문제</option></select></SettingRow></div><div className="mt-6 rounded-[24px] border border-[#d56262]/22 bg-[#241315] p-4"><p className="text-sm font-medium text-[#f7d0d0]">학습 데이터 초기화</p><p className="mt-2 text-sm leading-6 text-[#f0d0d0]/78">오답노트, 기록, 세션, 체크리스트가 모두 지워집니다.</p><div className="mt-4"><button type="button" onClick={resetAll} className="rounded-full border border-[#d56262]/28 bg-[#64262c] px-4 py-3 text-sm font-medium text-[#ffe8e8]">데이터 초기화</button></div></div></div></div>}
    </main>
  );
}

function Surface({ children }: { children: ReactNode }) {
  return <section className="relative overflow-hidden rounded-[30px] border border-[#d7b977]/18 bg-white/6 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl animate-rise">{children}</section>;
}
function CardEyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[11px] uppercase tracking-[0.22em] text-[#d7b977]">{children}</p>;
}
function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-[#d7b977]/16 bg-[#09231b] px-3 py-2 text-xs text-[#efe2be]">{children}</span>;
}
function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[22px] border border-[#d7b977]/16 bg-[#09231b] px-4 py-3"><p className="text-[11px] uppercase tracking-[0.18em] text-[#d7b977]">{label}</p><p className="mt-2 break-words text-xl font-semibold text-[#f8f1de]">{value}</p></div>;
}
function PlayingCard({ card }: { card: string }) {
  return <span className="grid h-14 w-10 place-items-center rounded-[14px] border border-[#e6dec7]/35 bg-[#fffaf0] shadow-[0_8px_24px_rgba(0,0,0,0.18)]"><span className={cn("text-sm font-semibold", card.endsWith("h") || card.endsWith("d") ? "text-rose-400" : "text-slate-700")}>{card}</span></span>;
}
function Primary({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center justify-center rounded-full bg-[#d7b977] px-5 py-3 text-sm font-semibold text-[#1b231b] shadow-[0_14px_32px_rgba(215,185,119,0.28)] transition hover:brightness-105">{children}</button>;
}
function Secondary({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={cn("inline-flex items-center justify-center rounded-full border border-[#d7b977]/18 bg-white/6 px-5 py-3 text-sm font-medium text-[#f6efe0] transition", disabled ? "cursor-not-allowed opacity-40" : "hover:bg-white/10")}>{children}</button>;
}
function Quick({ title, subtitle, tone, onClick }: { title: string; subtitle: string; tone: "emerald" | "amber" | "sky" | "rose"; onClick: () => void }) {
  const toneClass = tone === "emerald" ? "from-emerald-400/22" : tone === "amber" ? "from-amber-300/22" : tone === "sky" ? "from-sky-300/22" : "from-rose-300/22";
  return <button type="button" onClick={onClick} className={cn("rounded-[24px] border border-[#d7b977]/16 bg-[#08221a] p-4 text-left transition hover:bg-[#0c2a20]", `bg-gradient-to-br ${toneClass} to-transparent`)}><p className="text-[11px] uppercase tracking-[0.18em] text-[#d7b977]">Quick Start</p><p className="mt-2 text-xl font-semibold text-[#f8f1de]">{title}</p><p className="mt-1 text-sm text-[#efe2be]/76">{subtitle}</p></button>;
}
function SettingRow({ label, description, children }: { label: string; description: string; children: ReactNode }) {
  return <div className="flex items-center justify-between gap-4 rounded-[24px] border border-[#d7b977]/16 bg-[#09231b] px-4 py-4"><div><p className="text-base font-medium text-[#f8f1de]">{label}</p><p className="mt-1 text-sm leading-6 text-[#efe2be]/76">{description}</p></div>{children}</div>;
}
function Toggle({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("relative h-9 w-16 rounded-full transition", checked ? "bg-[#2f9f6b]" : "bg-[#27443a]")}><span className={cn("absolute top-1 h-7 w-7 rounded-full bg-[#fbf5e6] transition", checked ? "left-8" : "left-1")} /></button>;
}




