import { createDefaultStore } from "@/lib/holdem/constants";
import { QUESTIONS_BY_ID } from "@/lib/holdem/questions";
import { createSession, getDailySessionKey } from "@/lib/holdem/sessions";
import { liveTipSections } from "@/lib/training-data";
import type { AnswerChoice } from "@/lib/training-data";
import type { ResponseEntry, Session, Store } from "@/lib/holdem/types";
import type { HoldemQuizAppState } from "./holdem-quiz-model";

export type HoldemQuizQAScenario = {
  id: string;
  label: string;
  description: string;
  state: HoldemQuizAppState;
};

export type QuestionQAMode = "quiz" | "feedback";

const FIXED_NOW = "2026-03-25T12:00:00+09:00";
const FIXED_NOW_DATE = new Date(FIXED_NOW);

const getQuestion = (questionId: string) => {
  const question = QUESTIONS_BY_ID[questionId];

  if (!question) {
    throw new Error(`Unknown QA question fixture: ${questionId}`);
  }

  return question;
};

const getIncorrectChoice = (questionId: string): AnswerChoice => {
  const question = getQuestion(questionId);

  if (question.category === "odds") {
    return question.options.find((option) => option.value !== question.correct)?.value ?? question.correct;
  }

  return ["fold", "call", "raise"].find((choice) => choice !== question.correct) ?? question.correct;
};

const buildTimestamp = (daysAgo: number, hour: number) => {
  const value = new Date(FIXED_NOW_DATE);
  value.setDate(value.getDate() - daysAgo);
  value.setHours(hour, 0, 0, 0);
  return value.toISOString();
};

const buildResponse = (
  questionId: string,
  choice: AnswerChoice,
  daysAgo: number,
  hour: number,
): ResponseEntry => {
  const question = getQuestion(questionId);

  return {
    questionId: question.id,
    category: question.category,
    choice,
    correct: choice === question.correct,
    correctChoice: question.correct,
    answeredAt: buildTimestamp(daysAgo, hour),
    tags: [...question.tags],
  };
};

const buildStore = ({
  responses = [],
  tipCheckIds = [],
  sessions = {},
}: {
  responses?: ResponseEntry[];
  tipCheckIds?: string[];
  sessions?: Record<string, Session>;
} = {}): Store => ({
  ...createDefaultStore(),
  responses,
  tipChecks: Object.fromEntries(tipCheckIds.map((tipId) => [tipId, true])) as Record<string, boolean>,
  sessions,
});

const checkedTipIds = liveTipSections.flatMap((section) => section.items.map((item) => item.id));

const populatedResponses = [
  buildResponse("post-012", "call", 0, 9),
  buildResponse("pre-003", "call", 0, 8),
  buildResponse("odds-004", "25", 1, 20),
  buildResponse("post-004", "call", 1, 18),
  buildResponse("pre-005", "call", 2, 21),
  buildResponse("post-019", "raise", 3, 19),
  buildResponse("odds-007", "33", 4, 20),
  buildResponse("pre-002", "raise", 5, 18),
  buildResponse("post-005", "raise", 6, 17),
];

const activeDailySession: Session = {
  ...createSession(
    getDailySessionKey(FIXED_NOW_DATE),
    "오늘의 10문제",
    ["pre-002", "post-019", "odds-004", "post-012"],
  ),
  index: 2,
  results: [
    {
      questionId: "pre-002",
      choice: "raise",
      correct: true,
    },
    {
      questionId: "post-019",
      choice: "raise",
      correct: false,
    },
  ],
};

const quizFeedbackSession: Session = {
  ...createSession("qa:quiz-feedback", "QA Feedback", ["post-019", "post-012"]),
  index: 1,
  results: [
    {
      questionId: "post-019",
      choice: "raise",
      correct: false,
    },
  ],
};

const quizSummarySession: Session = {
  ...createSession("qa:quiz-summary", "오늘의 10문제", ["pre-002", "post-004", "odds-004"]),
  index: 3,
  results: [
    {
      questionId: "pre-002",
      choice: "raise",
      correct: true,
    },
    {
      questionId: "post-004",
      choice: "call",
      correct: true,
    },
    {
      questionId: "odds-004",
      choice: "33",
      correct: false,
    },
  ],
};

export const DEFAULT_HOLDEM_QUIZ_QA_SCENARIO_ID = "home-default";

export const holdemQuizQAScenarios: HoldemQuizQAScenario[] = [
  {
    id: "home-default",
    label: "Home Default",
    description: "첫 진입 상태의 홈 화면입니다.",
    state: {
      store: buildStore(),
      view: "home",
      tab: "home",
      session: null,
      feedback: null,
      summary: null,
      settingsOpen: false,
      wrongFilter: "all",
      nowIso: FIXED_NOW,
    },
  },
  {
    id: "home-progress",
    label: "Home Progress",
    description: "진행률, 활성 세션, 약점 태그가 채워진 홈 화면입니다.",
    state: {
      store: buildStore({
        responses: populatedResponses,
        tipCheckIds: checkedTipIds.slice(0, 4),
        sessions: {
          [activeDailySession.key]: activeDailySession,
        },
      }),
      view: "home",
      tab: "home",
      session: null,
      feedback: null,
      summary: null,
      settingsOpen: false,
      wrongFilter: "all",
      nowIso: FIXED_NOW,
    },
  },
  {
    id: "wrongs-list",
    label: "Wrongs List",
    description: "오답 리스트와 약점 태그 버튼이 노출된 상태입니다.",
    state: {
      store: buildStore({
        responses: populatedResponses,
        tipCheckIds: checkedTipIds.slice(0, 2),
      }),
      view: "wrongs",
      tab: "wrongs",
      session: null,
      feedback: null,
      summary: null,
      settingsOpen: false,
      wrongFilter: "all",
      nowIso: FIXED_NOW,
    },
  },
  {
    id: "records-populated",
    label: "Records Populated",
    description: "정답률, 최근 7일 추이, 추천 약점 카드가 채워진 기록 화면입니다.",
    state: {
      store: buildStore({
        responses: populatedResponses,
        tipCheckIds: checkedTipIds.slice(0, 3),
      }),
      view: "records",
      tab: "records",
      session: null,
      feedback: null,
      summary: null,
      settingsOpen: false,
      wrongFilter: "all",
      nowIso: FIXED_NOW,
    },
  },
  {
    id: "live-tips",
    label: "Live Tips",
    description: "체크리스트 카드가 일부 완료된 라이브 팁 화면입니다.",
    state: {
      store: buildStore({
        tipCheckIds: checkedTipIds.slice(0, 6),
      }),
      view: "liveTips",
      tab: "home",
      session: null,
      feedback: null,
      summary: null,
      settingsOpen: false,
      wrongFilter: "all",
      nowIso: FIXED_NOW,
    },
  },
  {
    id: "quiz-preflop",
    label: "Quiz Preflop",
    description: "프리플랍 퀴즈 기본 상태입니다.",
    state: {
      store: buildStore(),
      view: "quiz",
      tab: "home",
      session: createSession("qa:quiz-preflop", "QA Preflop", ["pre-002", "pre-005"]),
      feedback: null,
      summary: null,
      settingsOpen: false,
      wrongFilter: "all",
      nowIso: FIXED_NOW,
    },
  },
  {
    id: "quiz-postflop",
    label: "Quiz Postflop",
    description: "일반 포스트플랍 퀴즈 상태입니다.",
    state: {
      store: buildStore(),
      view: "quiz",
      tab: "home",
      session: createSession("qa:quiz-postflop", "QA Postflop", ["post-004", "post-005"]),
      feedback: null,
      summary: null,
      settingsOpen: false,
      wrongFilter: "all",
      nowIso: FIXED_NOW,
    },
  },
  {
    id: "quiz-postflop-11bb",
    label: "Quiz Postflop 11bb",
    description: "11bb 배럴/세컨드 배럴 케이스를 재현하는 퀴즈 상태입니다.",
    state: {
      store: buildStore(),
      view: "quiz",
      tab: "home",
      session: createSession("qa:quiz-postflop-11bb", "QA Postflop 11bb", ["post-019", "post-012"]),
      feedback: null,
      summary: null,
      settingsOpen: false,
      wrongFilter: "all",
      nowIso: FIXED_NOW,
    },
  },
  {
    id: "quiz-odds",
    label: "Quiz Odds",
    description: "포트 오즈 퀴즈 기본 상태입니다.",
    state: {
      store: buildStore(),
      view: "quiz",
      tab: "home",
      session: createSession("qa:quiz-odds", "QA Odds", ["odds-004", "odds-007"]),
      feedback: null,
      summary: null,
      settingsOpen: false,
      wrongFilter: "all",
      nowIso: FIXED_NOW,
    },
  },
  {
    id: "quiz-feedback-sheet",
    label: "Quiz Feedback Sheet",
    description: "오답 피드백 시트가 열린 상태입니다.",
    state: {
      store: buildStore({
        responses: populatedResponses,
      }),
      view: "quiz",
      tab: "home",
      session: quizFeedbackSession,
      feedback: {
        questionId: "post-019",
        choice: "raise",
        correct: false,
        questionNumber: 1,
      },
      summary: null,
      settingsOpen: false,
      wrongFilter: "all",
      nowIso: FIXED_NOW,
    },
  },
  {
    id: "quiz-summary",
    label: "Quiz Summary",
    description: "세션 완료 요약 카드가 노출된 상태입니다.",
    state: {
      store: buildStore({
        responses: populatedResponses,
      }),
      view: "quiz",
      tab: "home",
      session: quizSummarySession,
      feedback: null,
      summary: {
        label: quizSummarySession.label,
        total: quizSummarySession.results.length,
        correct: quizSummarySession.results.filter((entry) => entry.correct).length,
      },
      settingsOpen: false,
      wrongFilter: "all",
      nowIso: FIXED_NOW,
    },
  },
  {
    id: "settings-modal",
    label: "Settings Modal",
    description: "설정 모달이 열린 상태입니다.",
    state: {
      store: buildStore({
        responses: populatedResponses,
        tipCheckIds: checkedTipIds.slice(0, 4),
        sessions: {
          [activeDailySession.key]: activeDailySession,
        },
      }),
      view: "home",
      tab: "home",
      session: null,
      feedback: null,
      summary: null,
      settingsOpen: true,
      wrongFilter: "all",
      nowIso: FIXED_NOW,
    },
  },
];

export const HOLDEM_QUIZ_QA_SCENARIOS_BY_ID = Object.fromEntries(
  holdemQuizQAScenarios.map((scenario) => [scenario.id, scenario]),
) as Record<string, HoldemQuizQAScenario>;

export const getHoldemQuizQAScenario = (scenarioId: string) =>
  HOLDEM_QUIZ_QA_SCENARIOS_BY_ID[scenarioId];

export const buildQuestionQAScenario = (
  questionId: string,
  mode: QuestionQAMode,
): HoldemQuizQAScenario | null => {
  const question = QUESTIONS_BY_ID[questionId];

  if (!question) {
    return null;
  }

  if (mode === "feedback") {
    const wrongChoice = getIncorrectChoice(questionId);

    return {
      id: `question-${questionId}-feedback`,
      label: `${questionId} Feedback`,
      description: `${questionId} 문제의 피드백 시트 상태입니다.`,
      state: {
        store: buildStore({
          responses: [buildResponse(questionId, wrongChoice, 0, 12)],
        }),
        view: "quiz",
        tab: "home",
        session: {
          ...createSession(`qa:question:${questionId}:feedback`, `QA ${questionId}`, [questionId]),
          index: 1,
          results: [
            {
              questionId,
              choice: wrongChoice,
              correct: false,
            },
          ],
        },
        feedback: {
          questionId,
          choice: wrongChoice,
          correct: false,
          questionNumber: 1,
        },
        summary: null,
        settingsOpen: false,
        wrongFilter: "all",
        nowIso: FIXED_NOW,
      },
    };
  }

  return {
    id: `question-${questionId}-quiz`,
    label: `${questionId} Quiz`,
    description: `${questionId} 문제의 기본 퀴즈 상태입니다.`,
    state: {
      store: buildStore(),
      view: "quiz",
      tab: "home",
      session: createSession(`qa:question:${questionId}:quiz`, `QA ${questionId}`, [questionId]),
      feedback: null,
      summary: null,
      settingsOpen: false,
      wrongFilter: "all",
      nowIso: FIXED_NOW,
    },
  };
};
