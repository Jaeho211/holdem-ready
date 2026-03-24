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

const ACTION_KEYWORDS: Record<string, SeatAction> = {
  오픈: "open",
  폴드: "fold",
  콜: "call",
  림프: "limp",
};

const POSITION_PATTERN =
  /^(UTG\+1|UTG|MP|LJ|HJ|CO|BTN|SB|BB)\s+(?:(\d+(?:\.\d+)?bb)\s+)?(오픈|폴드|콜|림프)/;

const POSTFLOP_ACTION_COPY = {
  "미니 체크레이즈": {
    label: "MIN X/R",
    aria: "mini check-raise",
  },
  체크레이즈: {
    label: "X/R",
    aria: "check-raise",
  },
  오버벳: {
    label: "OVB",
    aria: "overbet",
  },
  돈크벳: {
    label: "DONK",
    aria: "donk bet",
  },
  "c-bet": {
    label: "C-BET",
    aria: "continuation bet",
  },
  리드: {
    label: "LEAD",
    aria: "lead bet",
  },
} as const;

type PostflopActionKeyword = keyof typeof POSTFLOP_ACTION_COPY;

const POSTFLOP_ACTION_PATTERN =
  /(UTG\+1|UTG|MP|LJ|HJ|CO|BTN|SB|BB)\s+(미니 체크레이즈|체크레이즈|오버벳|돈크벳|c-bet|리드)/g;

function isBefore(seatIdx: number, heroIdx: number): boolean {
  return seatIdx < heroIdx;
}

function toSeatName(value: string): SeatName | null {
  return SEAT_ORDER.includes(value as SeatName) ? (value as SeatName) : null;
}

function getDisplayBetSize(value?: string) {
  if (!value) return undefined;

  const match = value.match(/\d+(?:\.\d+)?bb/);
  return match?.[0] ?? value;
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
  actionBefore: string,
  betSize?: string,
): SeatSpotlight | null {
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

  const action = POSTFLOP_ACTION_COPY[actionValue as PostflopActionKeyword];
  const displayBetSize = getDisplayBetSize(betSize);

  return {
    seat,
    label: action.label,
    actionText: actionValue,
    ariaLabel: `${seat}, ${action.aria}${displayBetSize ? `, ${displayBetSize}` : ""}`,
    summary: [seat, actionValue, displayBetSize].filter(Boolean).join(" "),
    betSize: displayBetSize,
  };
}
