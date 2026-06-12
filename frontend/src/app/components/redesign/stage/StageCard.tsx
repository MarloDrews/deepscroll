"use client"

// Stage card — content floats free in a dark theater: a borderless frosted
// slab in the center, detached pill chrome around it. PostCard owns all
// behavior (view tracking, like/save state, navigation); this is view-only.

import type { PostCardViewProps } from "../types"
import { fcNum, fcStr } from "@/types/post"

// Difficulty as three neutral dots inside a metadata pill. Neutral on
// purpose: the format dot above the slab is the only accent touch.
function StageDots({ value }: { value: number }) {
  return (
    <span className="flex gap-1" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`inline-block w-1 h-1 rounded-full ${i <= value ? "bg-ink-dim" : "bg-white/15"}`}
        />
      ))}
    </span>
  )
}

export default function StageCard({
  post,
  fc,
  style,
  visible,
  liked,
  likesCount,
  saved,
  saveCount,
  commentsCount,
  animatingLike,
  animatingSave,
  onLikeAnimEnd,
  onSaveAnimEnd,
  onToggleLike,
  onSave,
  onOpenComments,
  onShare,
}: PostCardViewProps) {
  const isStory = post.format === "stories"
  const title = (isStory ? fcStr(fc, "headline") : fcStr(fc, "the_question")) || post.title
  const framing = isStory ? "" : fcStr(fc, "framing_line")
  const teasers = Array.isArray(fc?.teasers) ? (fc.teasers as string[]) : []
  const difficulty = fcNum(fc, "post_difficulty")
  const minutes = fcNum(fc, "post_reading_time_min")
  const era = isStory ? fcStr(fc, "era") : ""
  // Kicker pill: field for questions, era label + category for stories.
  const kicker = isStory ? fcStr(fc, "era_label") : fcStr(fc, "field")
  const category = isStory ? fcStr(fc, "category") : ""

  return (
    <div className="relative h-full flex flex-col justify-center px-5 pt-16 pb-28 z-10">
      {/* Entrance: same gate as baseline, with a slightly deeper rise. */}
      <div
        className={`transition-all duration-500 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Format marker floating above the slab — the only accent touch. */}
        <div className="flex items-center gap-2 mb-3 pl-2">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: style.accent }} />
          <span className="text-xs font-mono lowercase tracking-widest text-ink-muted">
            {style.badge.toLowerCase()}
          </span>
        </div>

        {/* Frosted slab — depth from blur and fill only, no border, no shadow. */}
        <div className="rounded-3xl bg-white/[0.04] backdrop-blur-xl px-6 py-7">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-ink leading-snug">
            {title}
          </h2>
          {framing && (
            <p className="font-serif italic text-base text-ink-body leading-relaxed mt-3">
              {framing}
            </p>
          )}
          {teasers.length > 0 && (
            <div className="mt-5 space-y-2">
              {teasers.map((teaser, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white/[0.04] px-4 py-2.5 text-sm text-ink-dim leading-snug"
                >
                  {teaser}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating neutral metadata pills below the slab + author initial. */}
        <div className="flex items-center flex-wrap gap-2 mt-3 pl-1">
          {kicker && (
            <span className="flex items-center rounded-full bg-white/[0.05] backdrop-blur-md px-3 py-1.5 text-[11px] font-mono lowercase text-ink-muted leading-none">
              {kicker}
            </span>
          )}
          {category && (
            <span className="flex items-center rounded-full bg-white/[0.05] backdrop-blur-md px-3 py-1.5 text-[11px] font-mono lowercase text-ink-muted leading-none">
              {category}
            </span>
          )}
          {difficulty > 0 && (
            <span className="flex items-center rounded-full bg-white/[0.05] backdrop-blur-md px-3 py-1.5 leading-none">
              <StageDots value={difficulty} />
            </span>
          )}
          {minutes > 0 && (
            <span className="flex items-center rounded-full bg-white/[0.05] backdrop-blur-md px-3 py-1.5 text-[11px] font-mono text-ink-muted leading-none">
              {minutes} min
            </span>
          )}
          {era && (
            <span className="flex items-center rounded-full bg-white/[0.05] backdrop-blur-md px-3 py-1.5 text-[11px] font-mono text-ink-muted leading-none">
              {era}
            </span>
          )}
          {post.author_username && (
            <span className="ml-auto w-9 h-9 rounded-full bg-white/[0.06] backdrop-blur-md flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-ink-dim uppercase">
                {post.author_username[0]}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Interest tags — floating pills bottom-left, clear of the actions. */}
      {post.interests.length > 0 && (
        <div className="absolute left-4 right-20 bottom-24 flex flex-wrap gap-2 z-10">
          {post.interests.slice(0, 2).map((name) => (
            <span
              key={name}
              className="rounded-full bg-white/[0.05] backdrop-blur-md text-ink-dim text-xs px-3 py-1.5"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Detached action cluster at the right edge. Circles become capsules
          when a count appears; press feedback is a springy scale-down.
          Handlers arrive pre-wrapped with stopPropagation. */}
      <div className="absolute right-3 bottom-24 z-10 flex flex-col items-end gap-2.5">
        {/* Like */}
        <button
          onClick={onToggleLike}
          aria-label={liked ? "Unlike" : "Like"}
          className={`h-11 min-w-11 rounded-full backdrop-blur-md flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-150 active:scale-95 ${
            likesCount > 0 ? "px-3" : ""
          } ${liked ? "bg-like/10 text-like" : "bg-white/[0.06] text-ink-dim"}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={liked ? 0 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-5 h-5 shrink-0 ${animatingLike ? "heart-pop" : ""}`}
            onAnimationEnd={onLikeAnimEnd}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {likesCount > 0 && <span className="text-xs font-mono leading-none">{likesCount}</span>}
        </button>

        {/* Comments */}
        <button
          onClick={onOpenComments}
          aria-label="Comments"
          className={`h-11 min-w-11 rounded-full backdrop-blur-md flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-150 active:scale-95 bg-white/[0.06] text-ink-dim ${
            commentsCount > 0 ? "px-3" : ""
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 shrink-0"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {commentsCount > 0 && (
            <span className="text-xs font-mono leading-none">{commentsCount}</span>
          )}
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          aria-label={saved ? "Unsave" : "Save"}
          className={`h-11 min-w-11 rounded-full backdrop-blur-md flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-150 active:scale-95 ${
            saveCount > 0 ? "px-3" : ""
          } ${saved ? "bg-save/10 text-save" : "bg-white/[0.06] text-ink-dim"}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={saved ? 0 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-5 h-5 shrink-0 ${animatingSave ? "heart-pop" : ""}`}
            onAnimationEnd={onSaveAnimEnd}
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          {saveCount > 0 && <span className="text-xs font-mono leading-none">{saveCount}</span>}
        </button>

        {/* Share */}
        <button
          onClick={onShare}
          aria-label="Share"
          className="h-11 w-11 rounded-full backdrop-blur-md flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 bg-white/[0.06] text-ink-dim"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
