/**
 * JJ's mood: one number on a red → green scale.
 * Browser-safe (no imports from src/signals/sources).
 */

export const DEFAULT_JJ_MOOD = 0.5;

/** oklch hues of the two ends of the scale. */
export const MOOD_HUE_RED = 20;
export const MOOD_HUE_GREEN = 145;

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** The color for a mood: 0 = red, 1 = green, through amber. */
export function moodColor(mood: number): string {
  const t = clamp01(mood);
  const hue = Math.round(MOOD_HUE_RED + t * (MOOD_HUE_GREEN - MOOD_HUE_RED));
  return `oklch(0.72 0.19 ${hue})`;
}

/** Human-readable end of the scale the mood sits on. */
export function moodLabel(mood: number): "red" | "amber" | "green" {
  const t = clamp01(mood);
  if (t < 0.34) return "red";
  if (t > 0.66) return "green";
  return "amber";
}
