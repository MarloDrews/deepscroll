"use client"

// Folio bottom nav: hairline-top bar, thin-stroke glyphs, no glow. The
// active item reads as ink with a small 3px underline tick under the glyph.

import type { FeedNavProps } from "../types"

export default function FolioBottomNav({ items }: FeedNavProps) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 border-t border-edge bg-surface-0/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="h-14 flex">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            aria-label={item.label}
            className={`flex-1 flex flex-col items-center justify-center h-full cursor-pointer transition-colors duration-150 ${
              item.active ? "text-ink" : "text-ink-muted hover:text-ink-dim"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              {item.icon}
            </svg>
            <span
              aria-hidden
              className={`mt-1 h-[3px] w-4 ${item.active ? "bg-ink" : "bg-transparent"}`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
