"use client";

import type { PreflopQuestion } from "@/lib/training-data";
import { cn } from "./ui";

/* ── 9-handed seat order (preflop action order) ── */

const SEAT_ORDER = [
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

type SeatName = (typeof SEAT_ORDER)[number];

/* ── Seat positions around the ellipse (top%, left%) ── */

const SEAT_POSITIONS: Record<SeatName, { top: string; left: string }> = {
  SB:      { top: "2%",  left: "32%" },
  BB:      { top: "2%",  left: "68%" },
  UTG:     { top: "24%", left: "93%" },
  "UTG+1": { top: "55%", left: "96%" },
  MP:      { top: "82%", left: "84%" },
  LJ:      { top: "92%", left: "50%" },
  HJ:      { top: "82%", left: "16%" },
  CO:      { top: "55%", left: "4%" },
  BTN:     { top: "24%", left: "7%" },
};

/* ── Action types ── */

type SeatAction = "fold" | "open" | "call" | "limp" | "hero" | "waiting";

type SeatState = {
  action: SeatAction;
  betSize?: string;
};

const ACTION_A11Y_LABEL: Record<SeatAction, string> = {
  fold: "Fold",
  open: "Open raise",
  call: "Call",
  limp: "Limp",
  hero: "Hero",
  waiting: "Waiting",
};

/* ── Action keyword mapping ── */

const ACTION_KEYWORDS: Record<string, SeatAction> = {
  오픈: "open",
  폴드: "fold",
  콜: "call",
  림프: "limp",
};

const POSITION_PATTERN =
  /^(UTG\+1|UTG|MP|LJ|HJ|CO|BTN|SB|BB)\s+(?:(\d+bb)\s+)?(오픈|폴드|콜|림프)/;

/* ── Parser ── */

function isBefore(seatIdx: number, heroIdx: number): boolean {
  return seatIdx < heroIdx;
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

  // Fill remaining seats
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

/* ── Seat display labels (shorter for tight layout) ── */

const SEAT_LABELS: Record<SeatName, string> = {
  UTG: "UTG",
  "UTG+1": "+1",
  MP: "MP",
  LJ: "LJ",
  HJ: "HJ",
  CO: "CO",
  BTN: "BTN",
  SB: "SB",
  BB: "BB",
};

/* ── Seat style by action ── */

function getSeatStyle(action: SeatAction, isHero: boolean) {
  if (isHero) {
    return "border-[#d7b977] bg-[#2a2210] text-[#ffe8a8] shadow-[0_0_8px_rgba(215,185,119,0.3)]";
  }
  switch (action) {
    case "open":
      return "border-[#d98989]/80 bg-[#2f151b] text-[#ffe2e2]";
    case "call":
      return "border-[#69c193]/80 bg-[#113326] text-[#d2ffe6]";
    case "limp":
      return "border-[#71c89b]/75 bg-[#10291f] text-[#c4f0db]";
    case "fold":
      return "border-[#858585]/70 bg-[#222222] text-[#d0d0d0]";
    case "waiting":
      return "border-[#738096]/65 bg-[#18202e] text-[#d7e0ef]";
    default:
      return "border-white/8 bg-white/5 text-white/30";
  }
}

function getActionBadge(action: SeatAction) {
  switch (action) {
    case "fold":
      return "F";
    case "open":
      return "O";
    case "call":
      return "C";
    case "limp":
      return "L";
    default:
      return null;
  }
}

function getSeatAriaLabel(seat: SeatName, state: SeatState, isHero: boolean) {
  const seatLabel = isHero ? `${seat} (You)` : seat;
  const actionLabel = ACTION_A11Y_LABEL[state.action];
  const betLabel = state.betSize ? `, ${state.betSize}` : "";
  return `Seat ${seatLabel}, ${actionLabel}${betLabel}`;
}

/* ── SeatMarker ── */

function SeatMarker({
  seat,
  state,
  isHero,
}: {
  seat: SeatName;
  state: SeatState;
  isHero: boolean;
}) {
  const pos = SEAT_POSITIONS[seat];
  const style = getSeatStyle(state.action, isHero);
  const label = SEAT_LABELS[seat];
  const badge = getActionBadge(state.action);
  const seatAriaLabel = getSeatAriaLabel(seat, state, isHero);

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5"
      style={{ top: pos.top, left: pos.left }}
      role="group"
      aria-label={seatAriaLabel}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full border px-1.5 py-0.5 text-[11px] font-semibold leading-none tracking-wide transition-colors min-w-[32px]",
          style,
        )}
      >
        {isHero ? "YOU" : label}
      </div>
      {badge && !isHero && (
        <span className="rounded-full border border-[#efe2be]/40 bg-[#1b1b1b]/70 px-1 text-[9px] font-semibold leading-none text-[#efe2be]/90">
          {badge}
        </span>
      )}
      {state.betSize && state.action !== "hero" && (
        <span className="text-[10px] leading-none text-[#efe2be]/85">
          {state.betSize}
        </span>
      )}
      {state.action === "fold" && !isHero && (
        <span className="text-[10px] leading-none text-white/80">fold</span>
      )}
      {(state.action === "open" || state.action === "call" || state.action === "limp") && !isHero && !state.betSize && (
        <span className="text-[10px] leading-none text-[#efe2be]/80">
          {state.action}
        </span>
      )}
      {state.action === "waiting" && !isHero && (
        <span className="text-[10px] leading-none text-[#d8e0ef]/85">waiting</span>
      )}
      <span className="sr-only">{seatAriaLabel}</span>
    </div>
  );
}

/* ── PokerTableVisual ── */

export function PokerTableVisual({
  question,
}: {
  question: PreflopQuestion;
}) {
  const seatStates = parsePreflopActions(question.position, question.actionBefore);

  return (
    <div className="mt-3 flex w-full flex-col items-center gap-2">
      {/* Oval table with seats */}
      <div
        className="relative w-full max-w-[300px] aspect-[1.7]"
        role="group"
        aria-label="Preflop poker table seat status"
      >
        {/* Felt oval */}
        <div className="absolute inset-[14%_6%] rounded-full border border-[#d7b977]/18 bg-[radial-gradient(ellipse,rgba(62,173,126,0.1),transparent_70%)]" />

        {/* Dealer chip near BTN */}
        <div
          className="absolute flex h-4 w-4 items-center justify-center rounded-full bg-[#d7b977] text-[7px] font-bold text-[#1a1400] shadow-md"
          style={{ top: "32%", left: "14%" }}
        >
          D
        </div>

        {/* Seats */}
        {SEAT_ORDER.map((seat) => {
          const state = seatStates.get(seat) ?? { action: "waiting" as const };
          return (
            <SeatMarker
              key={seat}
              seat={seat}
              state={state}
              isHero={state.action === "hero"}
            />
          );
        })}
      </div>

      {/* Stack & table info */}
      <p className="text-[10px] leading-none text-[#efe2be]/50">
        {question.stack} · {question.table}
      </p>
    </div>
  );
}
