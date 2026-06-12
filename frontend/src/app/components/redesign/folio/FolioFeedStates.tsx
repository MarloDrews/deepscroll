"use client"

// Folio loading / empty feed states. Typography only: a small-caps word with
// an animated ellipsis (no spinner) and a serif sentence between hairlines.

import type { FeedStateProps } from "../types"

// Takes no props; a no-prop component is assignable to the FeedLoading slot.
export function FolioFeedLoading() {
  return (
    <div className="h-full flex items-center justify-center bg-surface-0">
      <p
        className="font-serif text-xs uppercase tracking-[0.3em] text-ink-dim"
        role="status"
        aria-label="Loading"
      >
        Loading
        {/* Dot animation lives in feed.css with a reduced-motion guard. */}
        <span aria-hidden className="folio-loading-dot">.</span>
        <span aria-hidden className="folio-loading-dot">.</span>
        <span aria-hidden className="folio-loading-dot">.</span>
      </p>
    </div>
  )
}

export function FolioFeedEmpty({ tab }: FeedStateProps) {
  return (
    <div className="h-full flex items-center justify-center bg-surface-0 px-10">
      <div className="w-full border-t border-b border-edge py-10 text-center">
        <p className="font-serif italic text-base text-ink-dim leading-relaxed">
          Nothing in {tab.label} yet. Adjust your interests to fill this page.
        </p>
      </div>
    </div>
  )
}
