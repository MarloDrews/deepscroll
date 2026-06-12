import { FORMAT_IDS, FORMAT_STYLES, type FormatId } from "./formats"

// The 9 feed tabs (For You + Following + 7 formats), ported from the TABS
// constant in frontend/src/app/page.tsx. The two non-format tabs use a
// near-white accent so the sliding indicator reads neutral on them.

export interface FeedTabDef {
  id: string
  label: string
  format: FormatId | null
  accent: string
  rgb: readonly [number, number, number]
}

export const TABS: FeedTabDef[] = [
  { id: "for-you", label: "For You", format: null, accent: "#eceeff", rgb: [236, 238, 255] },
  { id: "following", label: "Following", format: null, accent: "#eceeff", rgb: [236, 238, 255] },
  ...FORMAT_IDS.map((id) => ({
    id: id as string,
    label: FORMAT_STYLES[id].label,
    format: id as FormatId,
    accent: FORMAT_STYLES[id].accent,
    rgb: FORMAT_STYLES[id].rgb,
  })),
]
