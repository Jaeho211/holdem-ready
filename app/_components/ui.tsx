import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import {
  CARD_BACK_ASSET_PATH,
  getCardLabel,
  type CardCode,
  type CardSuit,
} from "@/lib/holdem/cards";

export const cn = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

export function Surface({ children }: { children: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-[30px] border border-[#d7b977]/18 bg-white/6 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl animate-rise">
      {children}
    </section>
  );
}

export function CardEyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[11px] uppercase tracking-[0.22em] text-[#d7b977]">{children}</p>;
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[#d7b977]/16 bg-[#09231b] px-3 py-2 text-xs text-[#efe2be]">
      {children}
    </span>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[#d7b977]/16 bg-[#09231b] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#d7b977]">{label}</p>
      <p className="mt-2 break-words text-xl font-semibold text-[#f8f1de]">{value}</p>
    </div>
  );
}

type PlayingCardSize = "xs" | "sm" | "md" | "lg";

const playingCardSizes: Record<
  PlayingCardSize,
  {
    width: number;
    height: number;
    className: string;
    cornerInset: number;
    cornerRankSize: number;
    cornerSuitSize: number;
    centerSuitSize: number;
    watermarkSuitSize: number;
    ruleWidth: string;
    centerGlowSize: string;
  }
> = {
  xs: {
    width: 48,
    height: 68,
    className: "h-[68px] w-12 rounded-[14px]",
    cornerInset: 5,
    cornerRankSize: 14,
    cornerSuitSize: 11,
    centerSuitSize: 22,
    watermarkSuitSize: 36,
    ruleWidth: "56%",
    centerGlowSize: "54%",
  },
  sm: {
    width: 56,
    height: 80,
    className: "h-20 w-14 rounded-[16px]",
    cornerInset: 6,
    cornerRankSize: 16,
    cornerSuitSize: 12,
    centerSuitSize: 26,
    watermarkSuitSize: 42,
    ruleWidth: "58%",
    centerGlowSize: "56%",
  },
  md: {
    width: 72,
    height: 104,
    className: "h-[104px] w-[72px] rounded-[18px]",
    cornerInset: 8,
    cornerRankSize: 20,
    cornerSuitSize: 15,
    centerSuitSize: 34,
    watermarkSuitSize: 56,
    ruleWidth: "60%",
    centerGlowSize: "58%",
  },
  lg: {
    width: 84,
    height: 120,
    className: "h-[120px] w-[84px] rounded-[20px]",
    cornerInset: 9,
    cornerRankSize: 22,
    cornerSuitSize: 16,
    centerSuitSize: 38,
    watermarkSuitSize: 62,
    ruleWidth: "62%",
    centerGlowSize: "60%",
  },
};

const suitStyles: Record<
  CardSuit,
  {
    symbol: string;
    color: string;
    line: string;
    glow: string;
    shadow: string;
  }
> = {
  s: {
    symbol: "♠",
    color: "#1d2530",
    line: "rgba(29, 37, 48, 0.16)",
    glow: "rgba(29, 37, 48, 0.12)",
    shadow: "rgba(29, 37, 48, 0.08)",
  },
  h: {
    symbol: "♥",
    color: "#c43a55",
    line: "rgba(196, 58, 85, 0.18)",
    glow: "rgba(196, 58, 85, 0.16)",
    shadow: "rgba(196, 58, 85, 0.1)",
  },
  d: {
    symbol: "♦",
    color: "#c95a41",
    line: "rgba(201, 90, 65, 0.18)",
    glow: "rgba(201, 90, 65, 0.14)",
    shadow: "rgba(201, 90, 65, 0.1)",
  },
  c: {
    symbol: "♣",
    color: "#1f2d26",
    line: "rgba(31, 45, 38, 0.16)",
    glow: "rgba(31, 45, 38, 0.12)",
    shadow: "rgba(31, 45, 38, 0.08)",
  },
};

function PlayingCardFace({
  card,
  size,
  className,
}: {
  card: CardCode;
  size: PlayingCardSize;
  className?: string;
}) {
  const rank = card[0];
  const suit = card[1] as CardSuit;
  const palette = suitStyles[suit];
  const layout = playingCardSizes[size];
  const cornerStyle: CSSProperties = {
    color: palette.color,
    left: layout.cornerInset,
    top: layout.cornerInset,
  };
  const mirroredCornerStyle: CSSProperties = {
    color: palette.color,
    right: layout.cornerInset,
    bottom: layout.cornerInset,
    transform: "rotate(180deg)",
  };
  const centerLineStyle: CSSProperties = {
    width: layout.ruleWidth,
    background: `linear-gradient(90deg, transparent, ${palette.line}, transparent)`,
  };
  const centerGlowStyle: CSSProperties = {
    width: layout.centerGlowSize,
    height: layout.centerGlowSize,
    background: `radial-gradient(circle, ${palette.glow} 0%, transparent 72%)`,
  };

  return (
    <span
      role="img"
      aria-label={getCardLabel(card)}
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden border border-[#eee3ce] bg-[linear-gradient(180deg,#fffefb_0%,#f8f1e4_100%)] shadow-[0_16px_34px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.95)]",
        playingCardSizes[size].className,
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-0">
        <span className="absolute inset-[6%] rounded-[inherit] border" style={{ borderColor: palette.line }} />
        <span className="absolute inset-x-[10%] top-[6%] h-[20%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.72),transparent_72%)]" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={centerGlowStyle} />
        <span className="absolute left-1/2 top-1/2 h-px -translate-x-1/2 -translate-y-1/2" style={centerLineStyle} />
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[52%] select-none leading-none opacity-[0.09]"
          style={{
            color: palette.color,
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: layout.watermarkSuitSize,
          }}
        >
          {palette.symbol}
        </span>
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[52%] select-none leading-none"
          style={{
            color: palette.color,
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: layout.centerSuitSize,
            textShadow: `0 5px 16px ${palette.shadow}`,
          }}
        >
          {palette.symbol}
        </span>
      </span>

      <span
        className="absolute flex select-none flex-col items-center leading-none"
        style={cornerStyle}
        aria-hidden="true"
      >
        <span
          className="font-black tracking-[-0.1em]"
          style={{ color: palette.color, fontSize: layout.cornerRankSize }}
        >
          {rank}
        </span>
        <span
          style={{
            color: palette.color,
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: layout.cornerSuitSize,
          }}
        >
          {palette.symbol}
        </span>
      </span>
      <span
        className="absolute flex select-none flex-col items-center leading-none"
        style={mirroredCornerStyle}
        aria-hidden="true"
      >
        <span
          className="font-black tracking-[-0.1em]"
          style={{ color: palette.color, fontSize: layout.cornerRankSize }}
        >
          {rank}
        </span>
        <span
          style={{
            color: palette.color,
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: layout.cornerSuitSize,
          }}
        >
          {palette.symbol}
        </span>
      </span>
    </span>
  );
}

export function PlayingCard({
  card,
  side = "face",
  size = "sm",
  className,
  priority,
}: {
  card?: CardCode;
  side?: "face" | "back" | "slot";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
}) {
  const currentSize = playingCardSizes[size];
  const alt = side === "back" ? "Face-down playing card" : card ? getCardLabel(card) : "Playing card";

  if (side === "slot" || (side === "face" && !card)) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-flex shrink-0 overflow-hidden border border-dashed border-[#d7b977]/16 bg-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
          currentSize.className,
          className,
        )}
      >
        <span className="absolute inset-[10%] rounded-[inherit] border border-[#d7b977]/10" />
      </span>
    );
  }

  if (side === "face" && card) {
    return <PlayingCardFace card={card} size={size} className={className} />;
  }

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden border border-[#f2ead7]/18 bg-[#fffaf0] shadow-[0_16px_34px_rgba(0,0,0,0.26)]",
        currentSize.className,
        className,
      )}
    >
      <Image
        src={CARD_BACK_ASSET_PATH}
        alt={alt}
        width={currentSize.width}
        height={currentSize.height}
        preload={priority}
        unoptimized
        className="h-full w-full object-cover"
      />
    </span>
  );
}

export function Primary({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-[#d7b977] px-5 py-3 text-sm font-semibold text-[#1b231b] shadow-[0_14px_32px_rgba(215,185,119,0.28)] transition hover:brightness-105",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Secondary({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-[#d7b977]/18 bg-white/6 px-5 py-3 text-sm font-medium text-[#f6efe0] transition",
        disabled ? "cursor-not-allowed opacity-40" : "hover:bg-white/10",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Quick({
  title,
  subtitle,
  tone,
  onClick,
}: {
  title: string;
  subtitle: string;
  tone: "emerald" | "amber" | "sky" | "rose";
  onClick: () => void;
}) {
  const toneClass =
    tone === "emerald"
      ? "from-emerald-400/22"
      : tone === "amber"
        ? "from-amber-300/22"
        : tone === "sky"
          ? "from-sky-300/22"
          : "from-rose-300/22";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[24px] border border-[#d7b977]/16 bg-[#08221a] p-4 text-left transition hover:bg-[#0c2a20]",
        `bg-gradient-to-br ${toneClass} to-transparent`,
      )}
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#d7b977]">Quick Start</p>
      <p className="mt-2 text-xl font-semibold text-[#f8f1de]">{title}</p>
      <p className="mt-1 text-sm text-[#efe2be]/76">{subtitle}</p>
    </button>
  );
}

export function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[24px] border border-[#d7b977]/16 bg-[#09231b] px-4 py-4">
      <div>
        <p className="text-base font-medium text-[#f8f1de]">{label}</p>
        <p className="mt-1 text-sm leading-6 text-[#efe2be]/76">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function Toggle({
  checked,
  onClick,
}: {
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("relative h-9 w-16 rounded-full transition", checked ? "bg-[#2f9f6b]" : "bg-[#27443a]")}
    >
      <span
        className={cn(
          "absolute top-1 h-7 w-7 rounded-full bg-[#fbf5e6] transition",
          checked ? "left-8" : "left-1",
        )}
      />
    </button>
  );
}
