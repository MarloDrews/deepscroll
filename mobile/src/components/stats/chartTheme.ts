import { FORMAT_IDS, FORMAT_STYLES } from "../../lib/formats"

// Stage chart chrome constants, ported from frontend/src/app/stats/page.tsx.
// The web tooltip (TT) is deliberately not ported: there is no hover on
// mobile; exact values live in the Table / Progress views instead.

export const FORMAT_COLORS: Record<string, string> = Object.fromEntries(
  FORMAT_IDS.map((id) => [id, FORMAT_STYLES[id].accent])
)
export const FORMATS: string[] = [...FORMAT_IDS]

export const DEFAULT_COLOR = "#7888a8"
export const LAMP = "#7c6fff"
export const RANK_COLORS = ["#7c6fff", "#6655d8", "#5040a8", "#3a2e78", "#251d4a"]

export const AXIS_COLOR = "#8a8a8a"
export const AXIS_FONT_SIZE = 11
export const GRID_COLOR = "rgba(200,200,200,0.07)"
export const EMPTY_CELL = "#1a1a1a"
export const GAUGE_TRACK = "rgba(255,255,255,0.08)"
export const INK = "#eeeeee"

// Heatmap ramps (lamp 124,111,255 by default, like the web components).
export function calendarRamp(intensity: number): string {
  return `rgba(124,111,255,${0.2 + intensity * 0.8})`
}

export function activityRamp(intensity: number, rgb = "124,111,255"): string {
  return `rgba(${rgb},${0.15 + intensity * 0.85})`
}

// Axis scale helper: round a data max up to a "nice" tick ceiling.
export function niceMax(value: number): number {
  if (value <= 0) return 1
  const exp = Math.pow(10, Math.floor(Math.log10(value)))
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (m * exp >= value) return m * exp
  }
  return 10 * exp
}
