import type { TrainingCategory } from "./types";

export const QUESTION_TAG_REGISTRY = {
  preflop: [
    "초반 포지션",
    "오프수트 브로드웨이",
    "버튼 스틸",
    "수딧 커넥터",
    "SB 디펜스",
    "BB 디펜스",
    "컷오프 오픈",
    "강한 브로드웨이",
    "작은 페어",
    "수딧 에이스",
    "지배당하는 핸드",
    "림퍼 아이솔레이트",
    "수딧 브로드웨이",
    "SB 스틸",
    "폴드 투 유",
    "3벳 팟",
    "4벳 팟",
    "포켓페어 오픈",
    "미들 포지션",
    "HJ 오픈",
    "스퀴즈",
    "오버림프",
    "숏스택",
  ],
  postflop: [
    "탑페어 운영",
    "플랍 콜다운",
    "강한 메이드 핸드",
    "젖은 보드",
    "약한 드로우",
    "턴 폴드",
    "강한 드로우",
    "오버페어 운영",
    "멀티웨이",
    "리버 밸류벳",
    "리버 블러프 캐치",
    "체크레이즈",
    "돈크벳 대응",
    "드라이 보드",
    "턴 더블배럴",
    "셋 슬로우플레이",
    "보텀페어",
    "미들페어",
  ],
  odds: [
    "아웃 계산",
    "턴 확률",
    "플랍 확률",
    "포트 오즈",
    "필요 승률",
    "콤보 드로우",
    "임플라이드 오즈",
    "리버스 임플라이드 오즈",
    "블러프 빈도",
    "MDF",
    "콤보 카운팅",
  ],
} as const satisfies Record<TrainingCategory, readonly string[]>;

export const QUESTION_TAG_SET_BY_CATEGORY: Record<
  TrainingCategory,
  ReadonlySet<string>
> = {
  preflop: new Set(QUESTION_TAG_REGISTRY.preflop),
  postflop: new Set(QUESTION_TAG_REGISTRY.postflop),
  odds: new Set(QUESTION_TAG_REGISTRY.odds),
};

export const ALL_QUESTION_TAGS = [
  ...QUESTION_TAG_REGISTRY.preflop,
  ...QUESTION_TAG_REGISTRY.postflop,
  ...QUESTION_TAG_REGISTRY.odds,
] as const;

export const ALL_QUESTION_TAG_SET = new Set<string>(ALL_QUESTION_TAGS);

export const isRegisteredQuestionTag = (
  category: TrainingCategory,
  tag: string,
) => QUESTION_TAG_SET_BY_CATEGORY[category].has(tag);
