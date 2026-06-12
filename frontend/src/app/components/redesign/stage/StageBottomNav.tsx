"use client"

// Stage bottom nav — a frosted pill dock floating inset from every edge.
// Active state is a filled neutral circle (functional, never glow).

import type { FeedNavProps } from "../types"

export default function StageBottomNav({ items }: FeedNavProps) {
  return (
    <div
      className="absolute left-4 right-4 z-30"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      <div className="h-14 rounded-full backdrop-blur-xl bg-white/[0.06] flex items-center justify-around px-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            aria-label={item.label}
            className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 ${
              item.active ? "bg-white/[0.12] text-ink" : "text-ink-muted hover:text-ink-dim"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              {item.icon}
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
