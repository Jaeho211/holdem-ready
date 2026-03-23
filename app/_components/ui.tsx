import type { ReactNode } from "react";

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

export function PlayingCard({ card }: { card: string }) {
  return (
    <span className="grid h-14 w-10 place-items-center rounded-[14px] border border-[#e6dec7]/35 bg-[#fffaf0] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
      <span
        className={cn(
          "text-sm font-semibold",
          card.endsWith("h") || card.endsWith("d") ? "text-rose-400" : "text-slate-700",
        )}
      >
        {card}
      </span>
    </span>
  );
}

export function Primary({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-full bg-[#d7b977] px-5 py-3 text-sm font-semibold text-[#1b231b] shadow-[0_14px_32px_rgba(215,185,119,0.28)] transition hover:brightness-105"
    >
      {children}
    </button>
  );
}

export function Secondary({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-[#d7b977]/18 bg-white/6 px-5 py-3 text-sm font-medium text-[#f6efe0] transition",
        disabled ? "cursor-not-allowed opacity-40" : "hover:bg-white/10",
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
