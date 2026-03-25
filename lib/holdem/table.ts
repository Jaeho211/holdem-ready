export const SEAT_ORDER = [
  "UTG",
  "UTG+1",
  "MP",
  "LJ",
  "HJ",
  "CO",
  "BTN",
  "SB",
  "BB",
] as const;

export type SeatName = (typeof SEAT_ORDER)[number];

export type SeatAction = "fold" | "open" | "call" | "limp" | "hero" | "waiting";

export type SeatState = {
  action: SeatAction;
  betSize?: string;
};

export type SeatSpotlight = {
  seat: SeatName;
  label: string;
  actionText: string;
  ariaLabel: string;
  summary: string;
  betSize?: string;
};

const SEAT_PATTERN = "UTG\\+1|UTG|MP|LJ|HJ|CO|BTN|SB|BB";

const ACTION_KEYWORDS: Record<string, SeatAction> = {
  오픈: "open",
  폴드: "fold",
  콜: "call",
  림프: "limp",
};

const POSITION_PATTERN =
  new RegExp(`^(${SEAT_PATTERN})\\s+(?:(\\d+(?:\\.\\d+)?bb)\\s+)?(오픈|폴드|콜|림프)`);

type PostflopActionCopy = {
  label: string;
  summary: string;
  aria: string;
};

const POSTFLOP_ACTION_COPY = {
  "큰 세컨드 배럴": { label: "BET", summary: "bet", aria: "bet" },
  "세컨드 배럴": { label: "BET", summary: "bet", aria: "bet" },
  배럴: { label: "BET", summary: "bet", aria: "bet" },
  "소형 돈크벳": { label: "BET", summary: "bet", aria: "bet" },
  돈크벳: { label: "BET", summary: "bet", aria: "bet" },
  "소형 c-bet": { label: "BET", summary: "bet", aria: "bet" },
  "c-bet": { label: "BET", summary: "bet", aria: "bet" },
  "큰 리드": { label: "BET", summary: "bet", aria: "bet" },
  "소형 리드": { label: "BET", summary: "bet", aria: "bet" },
  리드: { label: "BET", summary: "bet", aria: "bet" },
  체크레이즈: {
    label: "CHECK-RAISE",
    summary: "check-raise",
    aria: "check-raise",
  },
  오버벳: {
    label: "OVERBET",
    summary: "overbet",
    aria: "overbet",
  },
  "미니 체크레이즈": {
    label: "CHECK-RAISE",
    summary: "check-raise",
    aria: "check-raise",
  },
} as const satisfies Record<string, PostflopActionCopy>;

const CHECK_ACTION_COPY = {
  label: "CHECK",
  summary: "check",
  aria: "check",
} as const satisfies PostflopActionCopy;

type PostflopActionKeyword = keyof typeof POSTFLOP_ACTION_COPY;

const POSTFLOP_ACTION_PATTERN = new RegExp(
  `(${SEAT_PATTERN})\\s+(${Object.keys(POSTFLOP_ACTION_COPY)
    .sort((a, b) => b.length - a.length)
    .map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})`,
  "g",
);

const TRAILING_CHECK_PATTERN = /(플랍|턴|리버)\s+체크$/;
const SEAT_NAME_PATTERN = new RegExp(SEAT_PATTERN, "g");

function isBefore(seatIdx: number, heroIdx: number): boolean {
  return seatIdx < heroIdx;
}

function toSeatName(value: string): SeatName | null {
  return SEAT_ORDER.includes(value as SeatName) ? (value as SeatName) : null;
}

function getDisplayBetSize(value?: string) {
  if (!value) return undefined;

  const match = value.match(/\d+(?:\.\d+)?bb/);
  return match?.[0];
}

function getReferencedSeats(actionBefore: string): SeatName[] {
  const matches = actionBefore.match(SEAT_NAME_PATTERN) ?? [];
  const seats = new Set<SeatName>();

  for (const match of matches) {
    const seat = toSeatName(match);
    if (seat) {
      seats.add(seat);
    }
  }

  return [...seats];
}

function inferTrailingCheckSeat(actionBefore: string, heroPosition: string): SeatName | null {
  if (!TRAILING_CHECK_PATTERN.test(actionBefore)) {
    return null;
  }

  const heroSeat = toSeatName(heroPosition);
  if (!heroSeat) {
    return null;
  }

  const remainingSeats = getReferencedSeats(actionBefore).filter((seat) => seat !== heroSeat);
  return remainingSeats.length === 1 ? remainingSeats[0] : null;
}

function buildPostflopSpotlight(
  seat: SeatName,
  action: PostflopActionCopy,
  betSize?: string,
): SeatSpotlight {
  const displayBetSize = getDisplayBetSize(betSize);

  return {
    seat,
    label: action.label,
    actionText: action.summary,
    ariaLabel: [seat, action.aria, displayBetSize].filter(Boolean).join(", "),
    summary: [seat, displayBetSize, action.summary].filter(Boolean).join(" "),
    betSize: displayBetSize,
  };
}

export function parsePreflopActions(
  heroPosition: string,
  actionBefore: string,
): Map<string, SeatState> {
  const result = new Map<string, SeatState>();
  const heroIdx = SEAT_ORDER.indexOf(heroPosition as SeatName);

  result.set(heroPosition, { action: "hero" });

  if (actionBefore === "모두 폴드") {
    for (let i = 0; i < SEAT_ORDER.length; i++) {
      const seat = SEAT_ORDER[i];
      if (seat === heroPosition) continue;
      result.set(seat, { action: isBefore(i, heroIdx) ? "fold" : "waiting" });
    }
    return result;
  }

  const clauses = actionBefore.split(", ");
  for (const clause of clauses) {
    if (clause === "나머지 폴드") {
      for (const seat of SEAT_ORDER) {
        if (result.has(seat)) continue;
        const idx = SEAT_ORDER.indexOf(seat);
        result.set(seat, {
          action: isBefore(idx, heroIdx) ? "fold" : "waiting",
        });
      }
      continue;
    }

    const match = clause.match(POSITION_PATTERN);
    if (match) {
      const [, pos, betSize, keyword] = match;
      result.set(pos, {
        action: ACTION_KEYWORDS[keyword],
        betSize,
      });
    }
  }

  for (const seat of SEAT_ORDER) {
    if (!result.has(seat)) {
      const idx = SEAT_ORDER.indexOf(seat);
      result.set(seat, {
        action: isBefore(idx, heroIdx) ? "fold" : "waiting",
      });
    }
  }

  return result;
}

export function parsePostflopSpotlight(
  heroPosition: string,
  actionBefore: string,
  betSize?: string,
): SeatSpotlight | null {
  const trailingCheckSeat = inferTrailingCheckSeat(actionBefore, heroPosition);
  if (trailingCheckSeat) {
    return buildPostflopSpotlight(trailingCheckSeat, CHECK_ACTION_COPY);
  }

  const matches = Array.from(actionBefore.matchAll(POSTFLOP_ACTION_PATTERN));
  const lastMatch = matches.at(-1);

  if (!lastMatch) {
    return null;
  }

  const [, seatValue, actionValue] = lastMatch;
  const seat = toSeatName(seatValue);

  if (!seat) {
    return null;
  }

  return buildPostflopSpotlight(
    seat,
    POSTFLOP_ACTION_COPY[actionValue as PostflopActionKeyword],
    betSize,
  );
}
