// Maps character offsets in the combined string back to DOM Ranges and
// paints them with the CSS Custom Highlight API. The matching ::highlight()
// rules live in globals.css. Browsers without the API silently skip the
// visuals; speaking never depends on this file succeeding.

import type { TextSegment } from "./extractText"

export const SENTENCE_HIGHLIGHT = "read-aloud-sentence"
export const WORD_HIGHLIGHT = "read-aloud-word"

function highlightsSupported(): boolean {
  return typeof CSS !== "undefined" && "highlights" in CSS
}

// Finds the Text nodes covering [start, end) of the combined string and
// builds a Range across them. Unmapped separator characters between
// segments fall away naturally.
export function rangeFromOffsets(
  segments: TextSegment[],
  start: number,
  end: number
): Range | null {
  let startNode: Text | null = null
  let startOffset = 0
  let endNode: Text | null = null
  let endOffset = 0

  for (const seg of segments) {
    if (seg.end <= start) continue
    if (seg.start >= end) break
    if (!startNode) {
      startNode = seg.node
      startOffset = Math.max(0, start - seg.start)
    }
    endNode = seg.node
    endOffset = Math.min(end, seg.end) - seg.start
  }

  if (!startNode || !endNode) return null
  const range = document.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  return range
}

export function setHighlight(name: string, range: Range | null) {
  if (!highlightsSupported()) return
  if (range) CSS.highlights.set(name, new Highlight(range))
  else CSS.highlights.delete(name)
}

export function clearHighlights() {
  if (!highlightsSupported()) return
  CSS.highlights.delete(SENTENCE_HIGHLIGHT)
  CSS.highlights.delete(WORD_HIGHLIGHT)
}
