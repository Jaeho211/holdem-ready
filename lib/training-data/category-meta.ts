import type { AppTrainingCategory } from "./types";

export const categoryMeta: Record<
  AppTrainingCategory,
  {
    label: string;
    shortLabel: string;
    description: string;
    difficulty: string;
    accent: string;
    emphasis: string;
  }
> = {
  preflop: {
    label: "Preflop",
    shortLabel: "Preflop",
    description: "포지션과 핸드 선택부터 정리합니다.",
    difficulty: "기초 다지기",
    accent: "from-emerald-400/25 via-emerald-200/10 to-transparent",
    emphasis: "오픈 범위와 SB/BB 방어",
  },
  postflop: {
    label: "Postflop",
    shortLabel: "Postflop",
    description: "탑페어, 드로우, 강한 메이드 핸드 결정을 반복합니다.",
    difficulty: "실전 판단",
    accent: "from-amber-300/25 via-yellow-100/10 to-transparent",
    emphasis: "탑페어 과대평가 줄이기",
  },
  odds: {
    label: "Odds",
    shortLabel: "Odds",
    description: "아웃 수와 포트 오즈 감각을 짧게 훈련합니다.",
    difficulty: "보조 훈련",
    accent: "from-cyan-300/25 via-sky-200/10 to-transparent",
    emphasis: "필요 승률과 드로우 가격",
  },
  liveTips: {
    label: "Live Tips",
    shortLabel: "Live Tips",
    description: "라스베가스 테이블에서 당황하지 않게 체크리스트로 정리합니다.",
    difficulty: "현장 적응",
    accent: "from-rose-300/25 via-orange-200/10 to-transparent",
    emphasis: "블라인드 구조와 초보 실수",
  },
};
