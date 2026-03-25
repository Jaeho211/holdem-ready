import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  categoryMeta,
  liveTipSections,
  type AnswerChoice,
  type HoldemQuestion,
  type TrainingCategory,
} from "@/lib/training-data";
import { ACTIONS, TIP_TOTAL } from "@/lib/holdem/constants";
import type { CardCode } from "@/lib/holdem/cards";
import {
  GLOSSARY_TERMS,
  getQuestionGlossaryTerms,
  type GlossaryTermKey,
} from "@/lib/holdem/glossary";
import { parsePostflopSpotlight } from "@/lib/holdem/table";
import { PokerTableVisual } from "./poker-table";
import { QUESTIONS_BY_ID } from "@/lib/holdem/questions";
import { getChoiceLabel } from "@/lib/holdem/selectors";
import type {
  AppTab,
  AppView,
  Feedback,
  ResponseEntry,
  Session,
  Settings,
  Summary,
  TrendPoint,
  WrongFilter,
} from "@/lib/holdem/types";
import {
  CardEyebrow,
  Metric,
  PlayingCard,
  Primary,
  Secondary,
  SettingRow,
  Surface,
  Toggle,
  cn,
} from "./ui";

const VIEW_COPY: Record<
  Exclude<AppView, "quiz">,
  { title: string; description: string }
> = {
  home: {
    title: "라스베가스 대비",
    description: "짧은 실전 문제와 오답 보정으로 라이브 감각을 올립니다.",
  },
  wrongs: {
    title: "오답노트",
    description: "최근에 틀린 문제를 다시 모아 약한 결정만 빠르게 복습합니다.",
  },
  records: {
    title: "내 기록",
    description: "정답률, 약점, 최근 학습 흐름을 한 번에 봅니다.",
  },
  liveTips: {
    title: "Live Tips",
    description: "테이블 적응을 체크리스트형 카드로 정리합니다.",
  },
};

const WRONG_FILTERS: ReadonlyArray<{ key: WrongFilter; label: string }> = [
  { key: "all", label: "전체" },
  { key: "preflop", label: "Preflop" },
  { key: "postflop", label: "Postflop" },
  { key: "odds", label: "Odds" },
  { key: "liveTips", label: "Live Tips" },
];

const NAV_ITEMS: ReadonlyArray<{ id: AppTab; label: string }> = [
  { id: "home", label: "홈" },
  { id: "wrongs", label: "오답" },
  { id: "records", label: "기록" },
];

function GlossaryChip({
  term,
  onClick,
}: {
  term: GlossaryTermKey;
  onClick: (term: GlossaryTermKey) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(term)}
      className="inline-flex items-center gap-1 rounded-full border border-[#8ecdf7]/26 bg-[#0d2531]/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[#b9e2ff]"
      aria-label={`Explain ${GLOSSARY_TERMS[term].label}`}
    >
      {GLOSSARY_TERMS[term].label}
      <span className="rounded-full border border-[#8ecdf7]/30 px-1.5 py-0.5 text-[9px] leading-none">i</span>
    </button>
  );
}

export function LoadingScreen() {
  return (
    <main
      data-qa-screen="loading"
      className="relative z-10 mx-auto flex min-h-screen w-full max-w-[520px] items-center justify-center px-5 py-10"
    >
      <Surface>
        <p className="text-xs uppercase tracking-[0.28em] text-[#d7b977]">Holdem Ready</p>
        <h1 className="mt-3 font-serif text-3xl text-[#f6efe0]">모바일 학습 테이블 준비 중</h1>
      </Surface>
    </main>
  );
}

export function AppHeader({
  view,
  onOpenSettings,
}: {
  view: Exclude<AppView, "quiz">;
  onOpenSettings: () => void;
}) {
  const copy = VIEW_COPY[view];

  return (
    <header data-qa-region="app-header" className="mb-5 animate-rise">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#d7b977]">Holdem Ready</p>
          <h1 className="mt-2 font-serif text-[2rem] leading-none text-[#f8f1de]">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#efe2be]/78">{copy.description}</p>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-full border border-[#d7b977]/20 bg-white/6 p-3 text-[#f6efe0] shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur"
          aria-label="설정 열기"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
            <path d="M12 8.7a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Z" />
            <path d="m19.4 15-.8 1.4 1.2 2.1-2.1 2.1-2.1-1.2-1.4.8-.6 2.4h-3l-.6-2.4-1.4-.8-2.1 1.2-2.1-2.1 1.2-2.1-.8-1.4L2 12l2.4-.6.8-1.4-1.2-2.1 2.1-2.1 2.1 1.2 1.4-.8.6-2.4h3l.6 2.4 1.4.8 2.1-1.2 2.1 2.1-1.2 2.1.8 1.4L22 12Z" />
          </svg>
        </button>
      </div>
    </header>
  );
}

export function HomeScreen({
  todayCount,
  dailyGoal,
  hasActiveDailySession,
  hasWeaknessHistory,
  weakTags,
  streakDays,
  wrongsAvailable,
  tipCheckedCount,
  onStartDaily,
  onStartWrongs,
  onOpenLiveTips,
}: {
  todayCount: number;
  dailyGoal: Settings["dailyGoal"];
  hasActiveDailySession: boolean;
  hasWeaknessHistory: boolean;
  weakTags: string[];
  streakDays: number;
  wrongsAvailable: boolean;
  tipCheckedCount: number;
  onStartDaily: () => void;
  onStartWrongs: () => void;
  onOpenLiveTips: () => void;
}) {
  return (
    <section data-qa-screen="home" className="space-y-4">
      <Surface>
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(215,185,119,0.22),transparent_66%)]" />
        <div className="relative flex items-center gap-4">
          <div
            className="grid h-24 w-24 shrink-0 place-items-center rounded-full border border-[#d7b977]/20 bg-[#061d16]"
            style={{
              backgroundImage: `conic-gradient(#d7b977 ${Math.min(todayCount / dailyGoal, 1) * 360}deg, rgba(255,255,255,0.08) 0deg)`,
            }}
          >
            <div className="grid h-[4.7rem] w-[4.7rem] place-items-center rounded-full bg-[#09251d] text-center">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#d7b977]">Today</p>
                <p className="mt-1 text-2xl font-semibold text-[#f6efe0]">{todayCount}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm text-[#f6efe0]/70">
              오늘 목표 {dailyGoal}문제 중 {todayCount}문제 완료
            </p>
            <h2 className="mt-1 font-serif text-2xl text-[#fbf6ea]">
              {hasActiveDailySession ? "오늘 세션 이어서 가기" : "오늘의 10문제로 시작"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#efe2be]/80">
              {hasWeaknessHistory
                ? `${weakTags[0]}${weakTags[1] ? `, ${weakTags[1]}` : ""} 약점을 반영해 오늘 문제를 골랐습니다.`
                : "첫 세션은 Preflop, Postflop, Odds를 고르게 섞어 준비합니다."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#efe2be]">
              <span className="rounded-full border border-[#d7b977]/16 bg-[#09231b] px-3 py-2">
                연속 {streakDays}일
              </span>
              <span className="rounded-full border border-[#d7b977]/16 bg-[#09231b] px-3 py-2">
                {hasWeaknessHistory ? `세션 반영 ${weakTags[0]}` : "균형 세션"}
              </span>
            </div>
          </div>
        </div>
        <div className="relative mt-5 flex flex-col gap-3 sm:flex-row">
          <Primary onClick={onStartDaily}>
            {hasActiveDailySession ? "오늘의 10문제 이어풀기" : "오늘의 10문제 시작"}
          </Primary>
          <Secondary onClick={onStartWrongs} disabled={!wrongsAvailable}>
            최근 오답 다시
          </Secondary>
        </div>
      </Surface>
      <Surface>
        <CardEyebrow>빠른 메모</CardEyebrow>
        <h3 className="mt-2 font-serif text-2xl text-[#f6efe0]">Live Tips Progress</h3>
        <p className="mt-2 text-sm leading-6 text-[#efe2be]/80">
          체크리스트형으로 현장 적응 포인트를 관리합니다.
        </p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-semibold text-[#f8f1de]">
              {tipCheckedCount}/{TIP_TOTAL}
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-[#d7b977]">Live Tips</p>
          </div>
          <Secondary onClick={onOpenLiveTips}>Open Live Tips</Secondary>
        </div>
      </Surface>
    </section>
  );
}

export function WrongsScreen({
  wrongFilter,
  missed,
  onFilterChange,
  onStartWrongs,
  onStartWeakness,
}: {
  wrongFilter: WrongFilter;
  missed: ResponseEntry[];
  onFilterChange: (filter: WrongFilter) => void;
  onStartWrongs: () => void;
  onStartWeakness: (tag: string) => void;
}) {
  return (
    <section data-qa-screen="wrongs" className="space-y-4">
      <Surface>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardEyebrow>필터</CardEyebrow>
            <h2 className="mt-2 font-serif text-2xl text-[#f6efe0]">카테고리별 오답 확인</h2>
          </div>
          <Secondary onClick={onStartWrongs} disabled={!missed.length}>
            오답 10문제
          </Secondary>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {WRONG_FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onFilterChange(item.key)}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition",
                wrongFilter === item.key
                  ? "bg-[#d7b977] text-[#172016]"
                  : "border border-[#d7b977]/16 bg-[#09231b] text-[#efe2be]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Surface>
      {missed.length ? (
        missed.map((entry) => {
          const question = QUESTIONS_BY_ID[entry.questionId];

          return (
            <Surface key={`${entry.questionId}-${entry.answeredAt}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#d7b977]">
                    {categoryMeta[question.category].label}
                  </p>
                  <h3 className="mt-2 font-serif text-xl text-[#f6efe0]">{question.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#efe2be]/78">{question.pitfall}</p>
                </div>
                <span className="rounded-full border border-[#d56262]/30 bg-[#3b1b1d]/60 px-3 py-2 text-xs uppercase tracking-[0.18em] text-[#f2b4b4]">
                  Miss
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Metric label="내 선택" value={getChoiceLabel(question, entry.choice)} />
                <Metric label="정답" value={getChoiceLabel(question, question.correct)} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {question.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onStartWeakness(tag)}
                    className="rounded-full border border-[#d7b977]/20 bg-[#0b251c] px-3 py-2 text-xs text-[#efe2be]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </Surface>
          );
        })
      ) : (
        <Surface>
          <h3 className="font-serif text-2xl text-[#f6efe0]">
            {wrongFilter === "liveTips" ? "Live Tips는 체크리스트형입니다" : "아직 오답이 없습니다"}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#efe2be]/78">
            {wrongFilter === "liveTips"
              ? "현장 적응은 홈의 Live Tips에서 체크리스트로 관리합니다."
              : "문제를 풀기 시작하면 틀린 문제와 약한 태그가 이곳에 쌓입니다."}
          </p>
        </Surface>
      )}
    </section>
  );
}

export function RecordsScreen({
  overallAccuracy,
  streakDays,
  totalResponses,
  categoryAccuracies,
  trend,
  weakTags,
  onStartWeakness,
}: {
  overallAccuracy: number;
  streakDays: number;
  totalResponses: number;
  categoryAccuracies: Record<TrainingCategory, number | null>;
  trend: TrendPoint[];
  weakTags: string[];
  onStartWeakness: (tag: string) => void;
}) {
  return (
    <section data-qa-screen="records" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Surface>
          <CardEyebrow>전체</CardEyebrow>
          <p className="mt-2 text-4xl font-semibold text-[#f8f1de]">{overallAccuracy}%</p>
          <p className="mt-2 text-sm text-[#efe2be]/78">전체 정답률</p>
        </Surface>
        <Surface>
          <CardEyebrow>연속 학습</CardEyebrow>
          <p className="mt-2 text-4xl font-semibold text-[#f8f1de]">{streakDays}일</p>
          <p className="mt-2 text-sm text-[#efe2be]/78">최근 학습 흐름</p>
        </Surface>
        <Surface>
          <CardEyebrow>누적</CardEyebrow>
          <p className="mt-2 text-4xl font-semibold text-[#f8f1de]">{totalResponses}</p>
          <p className="mt-2 text-sm text-[#efe2be]/78">총 푼 문제 수</p>
        </Surface>
      </div>
      <Surface>
        <CardEyebrow>카테고리별</CardEyebrow>
        <h2 className="mt-2 font-serif text-2xl text-[#f6efe0]">현재 정확도 분포</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(["preflop", "postflop", "odds"] as TrainingCategory[]).map((category) => (
            <Metric
              key={category}
              label={categoryMeta[category].label}
              value={
                categoryAccuracies[category] !== null ? `${categoryAccuracies[category]}%` : "--"
              }
            />
          ))}
        </div>
      </Surface>
      <Surface>
        <CardEyebrow>최근 7일</CardEyebrow>
        <h2 className="mt-2 font-serif text-2xl text-[#f6efe0]">학습 빈도</h2>
        <div className="mt-5 grid grid-cols-7 items-end gap-2">
          {trend.map((entry) => (
            <div key={entry.label} className="text-center">
              <div
                className="mx-auto w-full rounded-t-[14px] bg-gradient-to-t from-[#d7b977] to-[#f5deb1]"
                style={{ height: Math.max(entry.count * 16, 14) }}
              />
              <p className="mt-2 text-[11px] text-[#efe2be]/70">{entry.label}</p>
            </div>
          ))}
        </div>
      </Surface>
      <Surface>
        <CardEyebrow>추천 학습</CardEyebrow>
        <h2 className="mt-2 font-serif text-2xl text-[#f6efe0]">지금 바로 붙들 약점 3개</h2>
        <div className="mt-4 space-y-3">
          {weakTags.map((tag) => (
            <div
              key={tag}
              className="flex items-center justify-between gap-3 rounded-[20px] border border-[#d7b977]/18 bg-[#0a241c] px-4 py-3"
            >
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[#d7b977]">Weak Spot</p>
                <p className="mt-1 text-lg font-medium text-[#f8f1de]">{tag}</p>
              </div>
              <Secondary onClick={() => onStartWeakness(tag)}>지금 5문제</Secondary>
            </div>
          ))}
        </div>
      </Surface>
    </section>
  );
}

export function LiveTipsScreen({
  tipChecks,
  onToggleTip,
  onBack,
}: {
  tipChecks: Record<string, boolean>;
  onToggleTip: (tipId: string) => void;
  onBack: () => void;
}) {
  const checkedCount = Object.values(tipChecks).filter(Boolean).length;

  return (
    <section data-qa-screen="liveTips" className="space-y-4">
      <Surface>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardEyebrow>체크리스트</CardEyebrow>
            <h2 className="mt-2 font-serif text-2xl text-[#f6efe0]">Live Tips Checklist</h2>
          </div>
          <div className="rounded-full border border-[#d7b977]/20 bg-[#091f18] px-3 py-2 text-sm text-[#efe2be]">
            {checkedCount}/{TIP_TOTAL}
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#efe2be]/78">
          긴 글 대신 카드 형태로 읽고 바로 체크해 두세요. 현장에서는 전략보다 어색함을 줄이는 것이 체감 효용이 큽니다.
        </p>
        <div className="mt-4">
          <Secondary onClick={onBack}>홈으로</Secondary>
        </div>
      </Surface>
      {liveTipSections.map((section) => (
        <Surface key={section.id}>
          <CardEyebrow>{section.subtitle}</CardEyebrow>
          <h3 className="mt-2 font-serif text-2xl text-[#f6efe0]">{section.title}</h3>
          <div className="mt-4 space-y-3">
            {section.items.map((item) => {
              const checked = Boolean(tipChecks[item.id]);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleTip(item.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-[22px] border px-4 py-4 text-left transition",
                    checked ? "border-[#2f9f6b]/40 bg-[#113326]" : "border-[#d7b977]/16 bg-[#09231b]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs",
                      checked
                        ? "border-[#57cb92] bg-[#1d7048] text-[#eaf7ef]"
                        : "border-[#d7b977]/22 text-[#d7b977]",
                    )}
                  >
                    {checked ? "OK" : "?"}
                  </span>
                  <span>
                    <span className="block text-base font-medium text-[#f8f1de]">{item.label}</span>
                    <span className="mt-2 block text-sm leading-6 text-[#efe2be]/76">{item.detail}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Surface>
      ))}
    </section>
  );
}

const BOARD_SLOT_COUNT = 5;

type TableSceneTone = "gold" | "emerald" | "rose" | "sky";
type TableSceneDetail = {
  label: string;
  value: string;
  tone: TableSceneTone;
};

function TableSceneStat({ label, value, tone }: TableSceneDetail) {
  const toneClass =
    tone === "emerald"
      ? "border-[#69c193]/20 bg-[#0f2e22] text-[#e2f6ea]"
      : tone === "rose"
        ? "border-[#d98989]/18 bg-[#2a171b] text-[#ffe7e7]"
        : tone === "sky"
          ? "border-[#8ecdf7]/18 bg-[#0d2531] text-[#e3f4ff]"
          : "border-[#d7b977]/18 bg-[#231d0e] text-[#fff2d4]";

  return (
    <div
      className={cn(
        "rounded-[16px] border px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        toneClass,
      )}
    >
      <p className="text-[9px] uppercase tracking-[0.2em] text-[#d7b977]/90">{label}</p>
      <p className="mt-1 break-words text-[11px] font-medium leading-4">{value}</p>
    </div>
  );
}

function getHeroCards(question: HoldemQuestion): CardCode[] {
  if (question.category === "odds") {
    return question.holeCards ? [...question.holeCards] : [];
  }

  return [...question.holeCards];
}

function getBoardCards(question: HoldemQuestion): CardCode[] {
  if (question.category === "preflop") {
    return [];
  }

  return question.board ? [...question.board] : [];
}

function getTableSceneDetails(question: HoldemQuestion): TableSceneDetail[] {
  if (question.category === "preflop") {
    return [
      { label: "Position", value: question.position, tone: "gold" },
      { label: "Stack", value: question.stack, tone: "emerald" },
      { label: "Table", value: question.table, tone: "sky" },
      { label: "Prior Action", value: question.actionBefore, tone: "rose" },
    ];
  }

  if (question.category === "postflop") {
    const spotlight = parsePostflopSpotlight(
      question.position,
      question.actionBefore,
      question.villainBet,
    );

    return [
      { label: "Pot", value: question.pot, tone: "gold" },
      {
        label: "Prior Action",
        value: spotlight?.summary ?? question.actionBefore,
        tone: "rose",
      },
    ];
  }

  return [
    { label: "Pot", value: question.pot, tone: "gold" },
    { label: "Bet", value: question.villainBet, tone: "rose" },
  ];
}

function formatBbValue(value: number) {
  if (!Number.isFinite(value)) {
    return "0bb";
  }

  const normalized = Number.isInteger(value) ? `${value}` : value.toFixed(1).replace(/\.0$/, "");
  return `${normalized}bb`;
}

function PotOddsVisual({
  pot,
  call,
  mathFocus,
  hideResult,
}: {
  pot: string;
  call: string;
  mathFocus: string;
  hideResult?: boolean;
}) {
  const potVal = parseFloat(pot);
  const callVal = parseFloat(call);
  const total = potVal + callVal;
  const existingPot = Math.max(potVal - callVal, 0);
  const requiredPct = total > 0 ? Math.round((callVal / total) * 100) : 0;
  const existingPotText = formatBbValue(existingPot);
  const totalAfterCallText = formatBbValue(total);

  return (
    <div className="mt-3 w-full">
      <p className="text-center text-[10px] uppercase tracking-[0.22em] text-[#8ecdf7]">
        {mathFocus}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-[14px] border border-[#d7b977]/16 bg-[#231d0e] px-2 py-2 text-center">
          <p className="text-[9px] uppercase tracking-[0.18em] text-[#d7b977]/70">기존 팟</p>
          <p className="mt-1 text-[12px] font-semibold text-[#fff2d4]">{existingPotText}</p>
        </div>
        <div className="rounded-[14px] border border-[#d56262]/16 bg-[#2a171b] px-2 py-2 text-center">
          <p className="text-[9px] uppercase tracking-[0.18em] text-[#d88989]/76">상대 베팅</p>
          <p className="mt-1 text-[12px] font-semibold text-[#ffe7e7]">{call}</p>
        </div>
      </div>
      <div className="mt-3 rounded-[12px] border border-[#8ecdf7]/14 bg-[#081a22] px-3 py-2 text-center">
        <p className="text-[10px] leading-4 text-[#d9ecfa]/72">
          {call}을 콜하면 총 {totalAfterCallText} 팟을 놓고 싸웁니다.
        </p>
      </div>
      {!hideResult && (
        <div className="mt-3 rounded-[12px] border border-[#8ecdf7]/18 bg-[#0d2531] px-3 py-2 text-center">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#8ecdf7]/80">필요 승률</p>
          <p className="mt-1 text-[22px] font-bold leading-none text-[#e3f4ff]">{requiredPct}%</p>
        </div>
      )}
    </div>
  );
}

function TableScene({
  question,
}: {
  question: HoldemQuestion;
}) {
  const boardWrapperRef = useRef<HTMLDivElement>(null);
  const boardRowRef = useRef<HTMLDivElement>(null);
  const [boardScale, setBoardScale] = useState(1);
  const heroCards = getHeroCards(question);
  const boardCards = getBoardCards(question);
  const sceneDetails = getTableSceneDetails(question);
  const boardSlots = Array.from({ length: BOARD_SLOT_COUNT }, (_, index) => boardCards[index] ?? null);
  const showBackCards = question.category === "odds" && !heroCards.length;
  const heroLabel = showBackCards ? "Hero Cards Hidden" : "Hero Hand";
  const heroHint =
    question.category === "preflop"
      ? "Preflop, the Board is not dealt yet."
      : showBackCards
        ? "핸드 없이 팟 오즈만 훈련합니다."
        : "Read the Board and Hero Hand together.";

  useEffect(() => {
    const wrapper = boardWrapperRef.current;
    const row = boardRowRef.current;
    if (!wrapper || !row) {
      return;
    }

    const recalculateBoardScale = () => {
      const available = wrapper.offsetWidth;
      const needed = row.scrollWidth;
      if (needed === 0) {
        setBoardScale(1);
        return;
      }
      setBoardScale(Math.min(1, available / needed));
    };

    recalculateBoardScale();

    const obs = new ResizeObserver(() => {
      recalculateBoardScale();
    });

    obs.observe(wrapper);
    obs.observe(row);

    return () => obs.disconnect();
  }, [question.id]);

  return (
    <div
      data-qa-region="table-scene"
      className="mt-3 flex min-h-0 flex-1 rounded-[28px] border border-[#d7b977]/20 bg-[#03130f] p-2 shadow-[0_18px_60px_rgba(0,0,0,0.34)]"
    >
      <div
        data-qa-region="table-felt"
        className="quiz-table-felt relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] px-3 pb-3 pt-3"
      >
        <div className="pointer-events-none absolute inset-x-[6%] top-[13%] h-[38%] rounded-[999px] border border-[#d7b977]/12 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.07),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-x-3 bottom-0 h-20 bg-[linear-gradient(180deg,rgba(4,23,17,0),rgba(4,23,17,0.78))]" />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-between">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-white/8 bg-white/6 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#f6efe0]">
              {question.difficulty}
            </span>
          </div>

          <div ref={boardWrapperRef} className="mt-4 w-full text-center">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#d7b977]">
              {question.category === "preflop" ? "Board Opens After The Deal" : "Board"}
            </p>
            <div
              ref={boardRowRef}
              className="mt-2.5 flex flex-nowrap justify-center gap-1.5 sm:gap-2"
              style={boardScale < 1 ? { zoom: boardScale } : undefined}
            >
              {boardSlots.map((card, index) => (
                <PlayingCard
                  key={`${question.id}-board-${index}`}
                  card={card ?? undefined}
                  side={card ? "face" : "slot"}
                  size="sm"
                  priority={Boolean(card && index < 3)}
                />
              ))}
            </div>
          </div>

          {question.category === "preflop" ? (
            <PokerTableVisual
              position={question.position}
              actionBefore={question.actionBefore}
              stack={question.stack}
              table={question.table}
            />
          ) : question.category === "postflop" ? (
            <>
              <PokerTableVisual
                position={question.position}
                actionBefore={question.preflopAction}
                postflopAction={question.actionBefore}
                currentBet={question.villainBet}
              />
              <div data-qa-region="table-scene-details" className="mt-2 grid w-full grid-cols-2 gap-2">
                {sceneDetails.map((detail) => (
                  <TableSceneStat
                    key={`${question.id}-${detail.label}`}
                    label={detail.label}
                    value={detail.value}
                    tone={detail.tone}
                  />
                ))}
              </div>
            </>
          ) : (
            question.holeCards ? (
              <div data-qa-region="table-scene-details" className="mt-3 grid w-full grid-cols-2 gap-2">
                {sceneDetails.map((detail) => (
                  <TableSceneStat
                    key={`${question.id}-${detail.label}`}
                    label={detail.label}
                    value={detail.value}
                    tone={detail.tone}
                  />
                ))}
              </div>
            ) : question.mathFocus.includes("아웃") || question.mathFocus.toLowerCase().includes("outs") ? (
              <div className="mt-3 w-full text-center">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#8ecdf7]">{question.mathFocus}</p>
                <p className="mt-2 text-[11px] leading-4 text-[#d9ecfa]/68">
                  필요한 용어는 문제 제목 아래 칩에서 바로 확인할 수 있습니다.
                </p>
              </div>
            ) : (
              <PotOddsVisual
                pot={question.pot}
                call={question.villainBet}
                mathFocus={question.mathFocus}
                hideResult
              />
            )
          )}

          <div className="mt-4 text-center">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#d7b977]">{heroLabel}</p>
            <div className="mt-2.5 flex justify-center gap-2.5">
              {(heroCards.length ? heroCards : [null, null]).map((card, index) => (
                <PlayingCard
                  key={`${question.id}-hero-${index}`}
                  card={card ?? undefined}
                  side={card ? "face" : showBackCards ? "back" : "slot"}
                  size="md"
                  priority={Boolean(card)}
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-4 text-[#efe2be]/70">{heroHint}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuizScreen({
  session,
  summary,
  currentQuestion,
  feedback,
  onExit,
  onAnswer,
  onStartWeakness,
  onNext,
  onOpenHome,
  onOpenRecords,
}: {
  session: Session;
  summary: Summary | null;
  currentQuestion: HoldemQuestion | null;
  feedback: Feedback | null;
  onExit: () => void;
  onAnswer: (choice: AnswerChoice) => void;
  onStartWeakness: (tag: string) => void;
  onNext: () => void;
  onOpenHome: () => void;
  onOpenRecords: () => void;
}) {
  const answerOptions = currentQuestion?.category === "odds" ? currentQuestion.options : ACTIONS;
  const [activeTerm, setActiveTerm] = useState<GlossaryTermKey | null>(null);
  const questionTerms = useMemo(
    () => (currentQuestion ? getQuestionGlossaryTerms(currentQuestion) : []),
    [currentQuestion],
  );

  return (
    <section data-qa-screen="quiz" className="flex min-h-[100svh] flex-col overflow-hidden px-3 pb-3 pt-3">
      <header
        data-qa-region="quiz-header"
        className="z-20 mb-2 shrink-0 rounded-[22px] border border-[#d7b977]/18 bg-[#061d16]/90 px-3 py-3 shadow-[0_14px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-2 rounded-full border border-[#d7b977]/18 bg-white/6 px-3 py-2 text-xs text-[#efe2be]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
              <path d="m14 6-6 6 6 6" />
              <path d="M20 12H8" />
            </svg>
            종료
          </button>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#d7b977]">
              {summary
                ? "Session Complete"
                : currentQuestion
                  ? categoryMeta[currentQuestion.category].label
                  : "Holdem Ready"}
            </p>
            <p className="mt-1 text-xs text-[#f6efe0]">
              {summary
                ? session.label
                : `문제 ${feedback ? feedback.questionNumber : session.index + 1} / ${session.questionIds.length}`}
            </p>
          </div>
        </div>
      </header>
      {summary ? (
        <Surface>
          <CardEyebrow>세션 완료</CardEyebrow>
          <h2 className="mt-2 font-serif text-3xl text-[#f8f1de]">{summary.label}</h2>
          <p className="mt-3 text-sm leading-6 text-[#efe2be]/80">
            {summary.total}문제 중 {summary.correct}개를 맞혔습니다. 정답률은{" "}
            {Math.round((summary.correct / Math.max(summary.total, 1)) * 100)}%입니다.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Metric label="정답" value={`${summary.correct}`} />
            <Metric label="오답" value={`${summary.total - summary.correct}`} />
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Primary onClick={onOpenHome}>홈으로</Primary>
            <Secondary onClick={onOpenRecords}>기록 보기</Secondary>
          </div>
        </Surface>
      ) : currentQuestion ? (
        <div className="flex min-h-0 flex-1 flex-col animate-rise">
          <div
            data-qa-region="quiz-card"
            className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-[#d7b977]/20 bg-[linear-gradient(180deg,rgba(10,34,27,0.96),rgba(4,23,17,0.98))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.34)]"
          >
            <CardEyebrow>{currentQuestion.title}</CardEyebrow>
            <div
              data-qa-region="quiz-prompt"
              className="mt-3 rounded-[22px] border border-[#8ecdf7]/12 bg-[#081b22]/78 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8ecdf7]/72">상황</p>
              <p className="mt-2 text-sm leading-6 text-[#e3f4ff]/74">{currentQuestion.prompt}</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {questionTerms.map((term) => (
                <GlossaryChip
                  key={`${currentQuestion.id}-header-${term}`}
                  term={term}
                  onClick={setActiveTerm}
                />
              ))}
            </div>
            <TableScene question={currentQuestion} />
            {!feedback && (
              <div
                data-qa-region="decision-panel"
                className="mt-3 shrink-0 rounded-[24px] border border-[#d7b977]/20 bg-[#071d16]/96 p-2.5 shadow-[0_16px_44px_rgba(0,0,0,0.28)] backdrop-blur-xl"
              >
                <div className="flex items-center justify-between gap-3 px-1">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#d7b977]">
                    {currentQuestion.category === "odds"
                      ? currentQuestion.mathFocus.includes("아웃") ||
                        currentQuestion.mathFocus.toLowerCase().includes("outs")
                        ? "이 드로우의 승률은?"
                        : "콜에 필요한 승률은?"
                      : "Your Decision"}
                  </p>
                  <p className="text-[10px] text-[#efe2be]/64">
                    {currentQuestion.category === "odds" ? currentQuestion.mathFocus : "Current Spot"}
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {answerOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onAnswer(option.value)}
                      className={cn(
                        "min-h-[72px] rounded-[20px] border px-2 py-3 text-center transition hover:translate-y-[-1px]",
                        currentQuestion.category === "odds"
                          ? "border-[#86c7ff]/18 bg-[#0d2430] text-[#e2f2ff]"
                          : option.value === "fold"
                            ? "border-[#d56262]/18 bg-[#2b1618] text-[#ffe4e4]"
                            : option.value === "call"
                              ? "border-[#7db18f]/18 bg-[#10281e] text-[#e6f8ec]"
                              : "border-[#d7b977]/18 bg-[#2a2210] text-[#fff4dc]",
                      )}
                    >
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="mt-1.5 block text-[9px] uppercase tracking-[0.18em] opacity-70">
                        {currentQuestion.category === "odds" ? "승률" : "Decision"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {!feedback && (
            <div className="h-0" />
          )}
          {feedback && (
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[520px] px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
              <div
                data-qa-overlay="sheet-feedback"
                data-qa-scroll="sheet-feedback"
                className={cn(
                  "pointer-events-auto max-h-[65svh] overflow-y-auto rounded-[28px] border p-4 shadow-[0_20px_90px_rgba(0,0,0,0.48)] backdrop-blur-xl scrollbar-thin",
                  feedback.correct
                    ? "border-[#2f9f6b]/45 bg-[#0d2b20]/96"
                    : "border-[#d56262]/36 bg-[#2a1618]/96",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#d7b977]">
                      {feedback.correct ? "Correct Read" : "Leak Found"}
                    </p>
                    <h3 className="mt-2 font-serif text-[1.7rem] leading-tight text-[#f8f1de]">
                      추천 액션은 {getChoiceLabel(currentQuestion, currentQuestion.correct)}
                    </h3>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em]",
                      feedback.correct
                        ? "bg-[#1f6a45] text-[#edf7f1]"
                        : "bg-[#733236] text-[#ffe8e8]",
                    )}
                  >
                    {feedback.correct ? "Good Read" : "Leak"}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Metric label="내 선택" value={getChoiceLabel(currentQuestion, feedback.choice)} />
                  <Metric label="정답" value={getChoiceLabel(currentQuestion, currentQuestion.correct)} />
                </div>
                <p className="mt-4 text-[11px] italic leading-5 text-[#d7b977]/70">{currentQuestion.prompt}</p>
                <p className="mt-2 text-sm leading-6 text-[#efe2be]/82">{currentQuestion.explanation}</p>
                <div className="mt-3 rounded-[20px] border border-[#d7b977]/18 bg-black/15 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#d7b977]">Beginner Leak</p>
                  <p className="mt-2 text-sm leading-6 text-[#efe2be]/78">{currentQuestion.pitfall}</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Secondary
                    onClick={() => onStartWeakness(currentQuestion.tags[0])}
                    className="w-full justify-center"
                  >
                    비슷한 문제 더 풀기
                  </Secondary>
                  <Primary onClick={onNext} className="w-full justify-center">
                    {session.index >= session.questionIds.length ? "세션 결과 보기" : "다음 문제"}
                  </Primary>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
      {activeTerm && (
        <div className="fixed inset-0 z-[70] bg-[#020c09]/74 px-4 py-6 backdrop-blur-sm">
          <div
            data-qa-overlay="modal-glossary"
            className="mx-auto mt-8 max-w-[520px] rounded-[30px] border border-[#8ecdf7]/28 bg-[#08202a]/95 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#8ecdf7]">Term Help</p>
                <h2 className="mt-2 font-serif text-3xl text-[#e5f5ff]">{GLOSSARY_TERMS[activeTerm].label}</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTerm(null)}
                className="rounded-full border border-[#8ecdf7]/24 bg-white/6 p-3 text-[#e5f5ff]"
                aria-label={`Close ${GLOSSARY_TERMS[activeTerm].label} explanation`}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#d9ecfa]/84">{GLOSSARY_TERMS[activeTerm].short}</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[#d9ecfa]/78">
              {GLOSSARY_TERMS[activeTerm].details.map((line) => (
                <li key={`${activeTerm}-${line}`} className="rounded-[16px] border border-[#8ecdf7]/16 bg-[#0d2531]/70 px-3 py-2">
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Primary onClick={() => setActiveTerm(null)} className="w-full justify-center">
                Got it
              </Primary>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function BottomNav({
  tab,
  onOpenTab,
}: {
  tab: AppTab;
  onOpenTab: (next: AppTab) => void;
}) {
  return (
    <nav
      data-qa-overlay="fixed-bottom-nav"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[520px] px-4 pb-4 sm:px-5"
    >
      <div className="grid grid-cols-3 gap-2 rounded-[30px] border border-[#d7b977]/18 bg-[#061d16]/94 p-2 shadow-[0_18px_80px_rgba(0,0,0,0.46)] backdrop-blur-xl">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpenTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-[22px] px-3 py-3 text-xs transition",
              tab === item.id ? "bg-[#153a2d] text-[#fbf5e6]" : "text-[#efe2be]/72 hover:bg-white/6",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export function SettingsModal({
  settings,
  onClose,
  onUpdateSettings,
  onReset,
}: {
  settings: Settings;
  onClose: () => void;
  onUpdateSettings: (partial: Partial<Settings>) => void;
  onReset: () => void;
}) {
  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onUpdateSettings({ language: event.target.value as Settings["language"] });
  };

  const handleDailyGoalChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onUpdateSettings({ dailyGoal: Number(event.target.value) as Settings["dailyGoal"] });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#020c09]/72 px-4 py-6 backdrop-blur-sm">
      <div
        data-qa-overlay="modal-settings"
        className="mx-auto mt-8 max-w-[520px] rounded-[32px] border border-[#d7b977]/18 bg-[#071d16]/95 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#d7b977]">Settings</p>
            <h2 className="mt-2 font-serif text-3xl text-[#f6efe0]">앱 설정</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#d7b977]/18 bg-white/6 p-3 text-[#f6efe0]"
            aria-label="설정 닫기"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <SettingRow label="언어" description="MVP에서는 한국어 UI만 제공합니다.">
            <select
              value={settings.language}
              onChange={handleLanguageChange}
              className="rounded-full border border-[#d7b977]/18 bg-[#09231b] px-4 py-3 text-sm text-[#f6efe0]"
            >
              <option value="ko">한국어</option>
            </select>
          </SettingRow>
          <SettingRow label="진동" description="정답/오답 선택 후 짧은 햅틱 피드백">
            <Toggle checked={settings.vibration} onClick={() => onUpdateSettings({ vibration: !settings.vibration })} />
          </SettingRow>
          <SettingRow label="사운드" description="정답/오답 시 짧은 톤 재생">
            <Toggle checked={settings.sound} onClick={() => onUpdateSettings({ sound: !settings.sound })} />
          </SettingRow>
          <SettingRow label="하루 목표 문제 수" description="홈 대시보드 진행률 기준">
            <select
              value={settings.dailyGoal}
              onChange={handleDailyGoalChange}
              className="rounded-full border border-[#d7b977]/18 bg-[#09231b] px-4 py-3 text-sm text-[#f6efe0]"
            >
              <option value={5}>5문제</option>
              <option value={10}>10문제</option>
              <option value={20}>20문제</option>
            </select>
          </SettingRow>
        </div>
        <div className="mt-6 rounded-[24px] border border-[#d56262]/22 bg-[#241315] p-4">
          <p className="text-sm font-medium text-[#f7d0d0]">학습 데이터 초기화</p>
          <p className="mt-2 text-sm leading-6 text-[#f0d0d0]/78">
            오답노트, 기록, 세션, 체크리스트가 모두 지워집니다.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-[#d56262]/28 bg-[#64262c] px-4 py-3 text-sm font-medium text-[#ffe8e8]"
            >
              데이터 초기화
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
