import type { Post } from "../types/post"

// Port of frontend/src/lib/readingTime.ts. Reading time is computed, not
// authored: a stored estimate drifts from the content. We walk the post's
// sections, count every reader-facing word, and divide by a fixed
// words-per-minute rate. One rule holds for all formats.
const WORDS_PER_MINUTE = 230

// Keys whose string values are markup, URLs, or credit lines rather than
// reading text. Skipped so an SVG glyph or an image URL never counts as words.
// An image_caption is real reading text, so it is deliberately kept.
function isNonTextKey(key: string): boolean {
  if (key === "card_visual" || key === "svg" || key === "url") return true
  if (key === "attribution" || key === "image_attribution" || key === "doi") return true
  return key.endsWith("_url") || key.endsWith("_svg")
}

// Recursively gather reader-facing strings from arbitrary section content,
// skipping the non-text keys above.
function collect(node: unknown, out: string[]): void {
  if (node == null) return
  if (typeof node === "string") {
    out.push(node)
    return
  }
  if (Array.isArray(node)) {
    for (const item of node) collect(item, out)
    return
  }
  if (typeof node === "object") {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (isNonTextKey(key)) continue
      collect(value, out)
    }
  }
}

function countWords(strings: string[]): number {
  let total = 0
  for (const s of strings) {
    const trimmed = s.trim()
    if (trimmed) total += trimmed.split(/\s+/).length
  }
  return total
}

// Minutes of reading derived from the post's reader-facing text. Walks the
// sections generically, so it works for every format. Floor of 1 minute.
export function computeReadingTime(post: Post): number {
  const strings: string[] = []
  for (const section of post.sections) collect(section.content, strings)
  return Math.max(1, Math.round(countWords(strings) / WORDS_PER_MINUTE))
}
