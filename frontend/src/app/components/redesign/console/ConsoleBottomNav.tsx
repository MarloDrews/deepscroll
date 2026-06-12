"use client"

// Console bottom nav — a dock of five squared slots with icon plus tiny mono
// label. Active slot is an inverted steel-blue block (#7888a8 on #0a0a0a text
// is above 4.5:1); no glow, no shadow.

import type { FeedNavProps } from "../types"

export default function ConsoleBottomNav({ items }: FeedNavProps) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 bg-surface-0/95 backdrop-blur-md border-t border-edge"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="h-16 flex">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            aria-label={item.label}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors duration-150 ${
              item.active
                ? "bg-[#7888a8] text-[#0a0a0a]"
                : "text-ink-muted hover:text-ink-dim"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              {item.icon}
            </svg>
            <span className="font-mono text-[9px] uppercase tracking-wider leading-none">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
