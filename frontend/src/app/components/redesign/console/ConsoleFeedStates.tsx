"use client"

// Console feed loading / empty states — mono terminal lines, square frames.

import type { FeedStateProps } from "../types"

// Takes no props; a no-prop component is assignable to the FeedLoading slot.
export function ConsoleFeedLoading() {
  return (
    <div className="h-full flex items-center justify-center bg-surface-0">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-dim flex items-center gap-2">
        <span>LOADING FEED</span>
        {/* Blinking block cursor; static under prefers-reduced-motion. */}
        <span className="console-cursor inline-block w-2 h-3.5 bg-ink-dim" aria-hidden="true" />
      </p>
    </div>
  )
}

export function ConsoleFeedEmpty({ tab }: FeedStateProps) {
  return (
    <div className="h-full flex items-center justify-center bg-surface-0 px-8">
      <div className="border border-edge px-8 py-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-dim">
          NO ENTRIES &mdash; 00
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted mt-2">
          {tab.label} / EMPTY
        </p>
      </div>
    </div>
  )
}
