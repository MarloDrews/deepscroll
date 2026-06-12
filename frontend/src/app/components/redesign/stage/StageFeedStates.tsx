"use client"

// Stage feed loading and empty states — frosted slabs floating where the
// card slab would sit. Pulse keyframes live in feed.css (reduced-motion safe).

import type { FeedStateProps } from "../types"

// Takes no props; a no-prop component is assignable to the FeedLoading slot.
export function StageFeedLoading() {
  return (
    <div className="h-full flex flex-col justify-center px-5 gap-4">
      <div className="stage-pulse rounded-3xl bg-white/[0.04] backdrop-blur-xl h-72 w-full" />
      <div className="stage-pulse rounded-3xl bg-white/[0.04] backdrop-blur-xl h-20 w-3/4" />
    </div>
  )
}

export function StageFeedEmpty({ tab }: FeedStateProps) {
  return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="rounded-3xl bg-white/[0.04] backdrop-blur-xl px-8 py-10 text-center max-w-xs">
        <p className="font-serif text-xl text-ink leading-snug">The stage is empty</p>
        <p className="text-sm text-ink-muted mt-2">
          No {tab.label} posts yet. New ones will appear here.
        </p>
      </div>
    </div>
  )
}
