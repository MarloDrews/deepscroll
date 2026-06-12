// Temporary scoping layer for the three-design exploration branch
// (redesign/explore-3). Maps feed tabs and post formats to one of three
// coexisting design languages so they can be compared side by side:
//
//   folio   -> books, facts      (print/editorial, no card)
//   console -> people, concepts  (instrument panel, sharp grid)
//   stage   -> questions, stories (floating glass, pill chrome)
//
// null means baseline (current Lamplight/Circuit design). Academy is the
// deliberate untouched comparison baseline; for-you and following show mixed
// formats and also stay baseline. Every dispatch site must treat null as
// "render the existing code path unchanged".

import type { FormatId } from "@/lib/formats"

export type DesignId = "folio" | "console" | "stage"

const FORMAT_DESIGNS: Partial<Record<FormatId, DesignId>> = {
  books: "folio",
  facts: "folio",
  people: "console",
  concepts: "console",
  questions: "stage",
  stories: "stage",
  // academy intentionally absent: untouched baseline for comparison
}

// The 7 format feed tabs use the format id as the tab id, so both lookups
// share one table. "for-you" and "following" fall through to null.
export function designForTab(tabId: string): DesignId | null {
  return FORMAT_DESIGNS[tabId as FormatId] ?? null
}

export function designForFormat(format: string): DesignId | null {
  return FORMAT_DESIGNS[format as FormatId] ?? null
}
