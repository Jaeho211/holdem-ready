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
      return "border-[#d98989]/50 bg-[#2a171b] text-[#ffcece]";
    case "call":
      return "border-[#69c193]/50 bg-[#0f2e22] text-[#b8f0d0]";
    case "limp":
      return "border-[#69c193]/30 bg-[#0c2219] text-[#8fd4ae]";
    case "fold":
      return "border-white/8 bg-white/4 text-white/25";
    case "waiting":
      return "border-white/6 bg-white/3 text-white/18";
    default:
      return "border-white/8 bg-white/5 text-white/30";
  }
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

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5"
      style={{ top: pos.top, left: pos.left }}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold leading-none tracking-wide transition-colors min-w-[28px]",
          style,
        )}
      >
        {isHero ? "YOU" : label}
      </div>
      {state.betSize && state.action !== "hero" && (
        <span className="text-[8px] leading-none text-[#efe2be]/60">
          {state.betSize}
        </span>
      )}
      {state.action === "fold" && !isHero && (
        <span className="text-[7px] leading-none text-white/20">fold</span>
      )}
      {(state.action === "open" || state.action === "call" || state.action === "limp") && !isHero && !state.betSize && (
        <span className="text-[7px] leading-none text-[#efe2be]/40">
          {state.action}
        </span>
      )}
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
      <div className="relative w-full max-w-[300px] aspect-[1.7]">
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
