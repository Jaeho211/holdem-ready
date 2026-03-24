"use client";

import {
  SEAT_ORDER,
  parsePostflopSpotlight,
  parsePreflopActions,
  type SeatAction,
  type SeatName,
  type SeatSpotlight,
  type SeatState,
} from "@/lib/holdem/table";
import { cn } from "./ui";

/* ── Seat positions around the ellipse (top%, left%) ── */

const SEAT_POSITIONS: Record<SeatName, { top: string; left: string }> = {
  SB:      { top: "10%", left: "32%" },
  BB:      { top: "10%", left: "68%" },
  UTG:     { top: "24%", left: "93%" },
  "UTG+1": { top: "55%", left: "96%" },
  MP:      { top: "82%", left: "84%" },
  LJ:      { top: "92%", left: "50%" },
  HJ:      { top: "82%", left: "16%" },
  CO:      { top: "55%", left: "4%" },
  BTN:     { top: "24%", left: "7%" },
};

const ACTION_A11Y_LABEL: Record<SeatAction, string> = {
  fold: "Fold",
  open: "Open raise",
  call: "Call",
  limp: "Limp",
  hero: "Hero",
  waiting: "Waiting",
};

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

function getSeatAriaLabel(
  seat: SeatName,
  state: SeatState,
  isHero: boolean,
  spotlight?: SeatSpotlight,
) {
  const seatLabel = isHero ? `${seat} (You)` : seat;
  const actionLabel = ACTION_A11Y_LABEL[state.action];
  const betLabel = state.betSize ? `, ${state.betSize}` : "";
  const spotlightLabel = spotlight ? `. Current action: ${spotlight.ariaLabel}` : "";
  return `Seat ${seatLabel}, ${actionLabel}${betLabel}${spotlightLabel}`;
}

/* ── SeatMarker ── */

function SeatMarker({
  seat,
  state,
  isHero,
  spotlight,
}: {
  seat: SeatName;
  state: SeatState;
  isHero: boolean;
  spotlight?: SeatSpotlight;
}) {
  const pos = SEAT_POSITIONS[seat];
  const style = getSeatStyle(state.action, isHero);
  const label = SEAT_LABELS[seat];
  const badge = getActionBadge(state.action);
  const seatAriaLabel = getSeatAriaLabel(seat, state, isHero, spotlight);
  const spotlightCopy = spotlight ? [spotlight.label, spotlight.betSize].filter(Boolean).join(" ") : null;

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
          spotlight && "shadow-[0_0_0_1px_rgba(255,231,231,0.18),0_0_18px_rgba(217,137,137,0.24)]",
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
      {spotlightCopy && (
        <span className="rounded-full border border-[#d98989]/36 bg-[#3a1b22]/88 px-1.5 py-0.5 text-[9px] font-semibold leading-none tracking-[0.14em] text-[#ffe7e7] shadow-[0_8px_18px_rgba(0,0,0,0.24)]">
          {spotlightCopy}
        </span>
      )}
      <span className="sr-only">{seatAriaLabel}</span>
    </div>
  );
}

/* ── PokerTableVisual ── */

export function PokerTableVisual({
  position,
  actionBefore,
  stack,
  table,
  postflopAction,
  currentBet,
}: {
  position: string;
  actionBefore: string;
  stack?: string;
  table?: string;
  postflopAction?: string;
  currentBet?: string;
}) {
  const seatStates = parsePreflopActions(position, actionBefore);
  const spotlight = postflopAction ? parsePostflopSpotlight(postflopAction, currentBet) : null;

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
              spotlight={spotlight?.seat === seat ? spotlight : undefined}
            />
          );
        })}
      </div>

      {/* Stack & table info */}
      {(stack || table) && (
        <p className="text-[10px] leading-none text-[#efe2be]/50">
          {[stack, table].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  );
}
