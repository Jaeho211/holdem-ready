"use client";

import type { Settings } from "@/lib/holdem/types";

let audioContext: AudioContext | null = null;

export const registerServiceWorker = () => {
  if (process.env.NODE_ENV !== "production") return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => undefined);
};

export const playTone = (correct: boolean) => {
  if (typeof window === "undefined") return;

  const Context =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) return;

  if (!audioContext) audioContext = new Context();

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.value = correct ? 720 : 320;
  gain.gain.value = 0.018;

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + (correct ? 0.08 : 0.14));
};

export const triggerFeedback = (settings: Settings, correct: boolean) => {
  if (settings.vibration && typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(correct ? 20 : [60, 40, 60]);
  }

  if (settings.sound) playTone(correct);
};

export const downloadTextFile = ({
  content,
  fileName,
  contentType = "application/json",
}: {
  content: string;
  fileName: string;
  contentType?: string;
}) => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 0);
};
