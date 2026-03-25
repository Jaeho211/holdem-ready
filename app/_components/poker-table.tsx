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

const SPOTLIGHT_PLACEMENT: Record<SeatName, "above" | "below"> = {
  BTN: "below",
  SB: "below",
  BB: "below",
  UTG: "below",
  "UTG+1": "above",
  MP: "above",
  LJ: "above",
  HJ: "above",
  CO: "above",
};

/* ── Seat style by action ── */

function getSeatStyle(
  action: SeatAction,
  {
    isHero,
    isSpotlight,
  }: {
    isHero: boolean;
    isSpotlight: boolean;
  },
) {
  if (isHero) {
    return "border-[#f0d28f] bg-[linear-gradient(180deg,#3c2c0f,#1c1405)] text-[#fff4cb] shadow-[0_0_0_1px_rgba(255,235,184,0.2),0_0_24px_rgba(240,210,143,0.26),0_10px_22px_rgba(0,0,0,0.28)]";
  }
  if (isSpotlight) {
    return "border-[#d7a57f]/72 bg-[linear-gradient(180deg,#3a231b,#241712)] text-[#ffe8d8] shadow-[0_0_0_1px_rgba(255,231,213,0.12),0_0_18px_rgba(215,165,127,0.16),0_8px_20px_rgba(0,0,0,0.2)]";
  }
  switch (action) {
    case "open":
      return "border-[#786252]/34 bg-[#151511]/90 text-[#ceb8ab]/64";
    case "call":
      return "border-[#476857]/34 bg-[#101713]/90 text-[#bfdbcb]/62";
    case "limp":
      return "border-[#4b6559]/32 bg-[#101613]/90 text-[#bad2c6]/58";
    case "fold":
      return "border-white/8 bg-[#111412]/90 text-white/30";
    case "waiting":
      return "border-[#3f5148]/28 bg-[#101412]/88 text-[#9fb0a6]/48";
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

function getSeatContainerStyle(isHero: boolean, isSpotlight: boolean) {
  if (isHero) {
    return "z-30";
  }
  if (isSpotlight) {
    return "z-20";
  }
  return "z-0";
}

function getSeatChipLayoutStyle(isHero: boolean, isSpotlight: boolean) {
  if (isHero) {
    return "min-w-[42px] px-2 py-1 text-[12px] tracking-[0.14em] scale-[1.08]";
  }
  if (isSpotlight) {
    return "min-w-[38px] px-1.5 py-[0.35rem] text-[11.5px]";
  }
  return "min-w-[34px] px-1.5 py-0.5 text-[11.5px]";
}

function getSecondaryTextStyle(
  variant: "bet" | "fold" | "action" | "waiting",
  isHero: boolean,
  isSpotlight: boolean,
) {
  if (isHero) {
    return "text-[#fff0c7]/88";
  }
  if (isSpotlight) {
    switch (variant) {
      case "bet":
        return "text-[#ffe2ca]/92";
      case "fold":
        return "text-[#ffd6d6]/84";
      case "action":
        return "text-[#ffdcc3]/88";
      case "waiting":
        return "text-[#f4d7c4]/82";
      default:
        return "text-[#ffe2ca]/90";
    }
  }

  switch (variant) {
    case "bet":
      return "text-[#efe2be]/46";
    case "fold":
      return "text-white/42";
    case "action":
      return "text-[#efe2be]/44";
    case "waiting":
      return "text-[#d8e0ef]/42";
    default:
      return "text-white/40";
  }
}

function getActionBadgeStyle(isSpotlight: boolean) {
  if (isSpotlight) {
    return "border-[#f2d6bc]/38 bg-[#261712]/88 text-[#ffe6d1]";
  }
  return "border-white/8 bg-[#111513]/72 text-white/44";
}

function getSpotlightCopyStyle(seat: SeatName) {
  const isSidePlacement = seat === "BTN" || seat === "CO";

  return cn(
    "absolute z-10 whitespace-nowrap rounded-full border border-[#d7a57f]/34 bg-[#332019]/88 px-1.5 py-0.5 text-[9px] font-semibold leading-none tracking-[0.08em] text-[#ffe7d7] shadow-[0_8px_18px_rgba(0,0,0,0.24)]",
    seat === "BTN" && "left-[calc(100%+4px)] top-0",
    seat === "CO" && "left-[calc(100%+6px)] top-0",
    !isSidePlacement && "left-1/2 -translate-x-1/2",
    !isSidePlacement && SPOTLIGHT_PLACEMENT[seat] === "above" && "bottom-full mb-2",
    !isSidePlacement && SPOTLIGHT_PLACEMENT[seat] === "below" && "top-full mt-2",
    !isSidePlacement && "after:absolute after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-[#d7a57f]/38 after:content-['']",
    !isSidePlacement && SPOTLIGHT_PLACEMENT[seat] === "above" && "after:top-full after:h-3",
    !isSidePlacement && SPOTLIGHT_PLACEMENT[seat] === "below" && "after:bottom-full after:h-3",
  );
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
  const isSpotlight = Boolean(spotlight);
  const style = getSeatStyle(state.action, { isHero, isSpotlight });
  const label = SEAT_LABELS[seat];
  const badge = getActionBadge(state.action);
  const seatAriaLabel = getSeatAriaLabel(seat, state, isHero, spotlight);
  const spotlightCopy = spotlight ? [spotlight.label, spotlight.betSize].filter(Boolean).join(" ") : null;
  const hasDealerChip = seat === "BTN";

  return (
    <div
      data-qa-region={`table-seat:${seat}`}
      className={cn(
        "absolute flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2",
        getSeatContainerStyle(isHero, isSpotlight),
      )}
      style={{ top: pos.top, left: pos.left }}
      role="group"
      aria-label={seatAriaLabel}
    >
      <div className="relative">
        <div
          data-qa-region={`table-seat-chip:${seat}`}
          className={cn(
            "flex items-center justify-center rounded-full border font-semibold leading-none transition-[transform,colors,box-shadow]",
            style,
            getSeatChipLayoutStyle(isHero, isSpotlight),
          )}
        >
          {isHero ? "YOU" : label}
        </div>
        {hasDealerChip && (
          <div
            data-qa-region="table-dealer"
            className="absolute flex h-4 w-4 items-center justify-center rounded-full bg-[#d7b977] text-[7px] font-bold text-[#1a1400] shadow-md -translate-y-1/2"
            style={{ top: 0, left: "calc(100% + 4px)" }}
          >
            D
          </div>
        )}
      </div>
      {badge && !isHero && (
        <span
          data-qa-overlay={`table-action-badge:${seat}`}
          className={cn(
            "rounded-full border px-1 text-[9px] font-semibold leading-none",
            getActionBadgeStyle(isSpotlight),
          )}
        >
          {badge}
        </span>
      )}
      {state.betSize && state.action !== "hero" && (
        <span className={cn("text-[10px] leading-none", getSecondaryTextStyle("bet", isHero, isSpotlight))}>
          {state.betSize}
        </span>
      )}
      {state.action === "fold" && !isHero && (
        <span className={cn("text-[10px] leading-none", getSecondaryTextStyle("fold", isHero, isSpotlight))}>fold</span>
      )}
      {(state.action === "open" || state.action === "call" || state.action === "limp") && !isHero && !state.betSize && (
        <span className={cn("text-[10px] leading-none", getSecondaryTextStyle("action", isHero, isSpotlight))}>
          {state.action === "open" ? "open raise" : state.action}
        </span>
      )}
      {state.action === "waiting" && !isHero && (
        <span className={cn("text-[10px] leading-none", getSecondaryTextStyle("waiting", isHero, isSpotlight))}>waiting</span>
      )}
      {spotlightCopy && (
        <span
          data-qa-overlay={`table-spotlight:${seat}`}
          className={getSpotlightCopyStyle(seat)}
        >
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
  const spotlight = postflopAction
    ? parsePostflopSpotlight(position, postflopAction, currentBet)
    : null;

  return (
    <div className="mt-2 flex w-full flex-col items-center gap-2">
      {/* Oval table with seats */}
      <div
        data-qa-region="table-root"
        className="relative w-full max-w-[336px] aspect-[1.62] sm:max-w-[348px]"
        role="group"
        aria-label="Preflop poker table seat status"
      >
        {/* Felt oval */}
        <div className="absolute inset-[14%_6%] rounded-full border border-[#d7b977]/18 bg-[radial-gradient(ellipse,rgba(62,173,126,0.1),transparent_70%)]" />

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
