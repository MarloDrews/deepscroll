"use client"

// Stage detail chrome — floating frosted back button, an inset header slab,
// and a detached pill action bar. The page (post/[id]/page.tsx) owns all
// behavior; the bar only owns its own draft text.

import { useState } from "react"
import Link from "next/link"
import VerifiedBadge from "@/components/VerifiedBadge"
import { useAuth } from "@/app/lib/auth"
import type { DetailBackProps, DetailBarProps, DetailHeaderProps } from "../types"

export function StageDetailBack({ onClose }: DetailBackProps) {
  return (
    <button
      onClick={onClose}
      aria-label="Go back"
      className="absolute top-4 left-4 z-10 w-11 h-11 rounded-full bg-white/[0.08] backdrop-blur-md flex items-center justify-center text-ink-dim hover:text-ink cursor-pointer transition-all duration-150 active:scale-95"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )
}

export function StageDetailHeader({ post, style }: DetailHeaderProps) {
  return (
    <div className="mx-3 mb-3 rounded-3xl bg-white/[0.04] backdrop-blur-xl px-5 py-6">
      {/* Format marker — the only accent touch */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: style.accent }} />
        <span className="text-xs font-mono lowercase tracking-widest text-ink-muted">
          {style.badge.toLowerCase()}
        </span>
      </div>

      {/* Title */}
      <h1 className="font-serif text-3xl font-medium text-ink leading-snug mb-3">{post.title}</h1>

      {/* Attribution — same logic as the baseline detail header */}
      <div className="flex items-center gap-1 mb-4">
        {post.is_user_content && post.author_username ? (
          <span className="flex items-center gap-1 text-ink-muted text-xs">
            Submitted by{" "}
            <Link href={`/profile/${post.author_username}`} className="hover:text-ink-body transition-colors">
              @{post.author_username}
            </Link>
            {post.author_is_verified != null && post.author_is_verified > 0 && (
              <VerifiedBadge size={16} level={post.author_is_verified} />
            )}
          </span>
        ) : !post.is_user_content ? (
          <>
            <span className="text-ink-muted text-xs">Deepscroll</span>
            <VerifiedBadge size={12} variant="official" />
          </>
        ) : null}
      </div>

      {/* Interest tags as floating pills */}
      {post.interests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.interests.map((name) => (
            <span key={name} className="px-3 py-1 rounded-full text-xs bg-white/[0.06] text-ink-dim">
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function StageDetailBar({
  posting,
  onSubmitComment,
  liked,
  onToggleLike,
  saved,
  animatingSave,
  onSaveAnimEnd,
  onToggleSave,
  onShare,
}: DetailBarProps) {
  const { user } = useAuth()
  const [draft, setDraft] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body || posting) return
    await onSubmitComment(body)
    setDraft("")
  }

  return (
    <div
      className="absolute left-3 right-3 z-10 rounded-full backdrop-blur-xl bg-white/[0.06] px-2 py-1.5 flex items-center gap-1.5"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      {/* Comment input pill + circular send */}
      <div className="flex-1 min-w-0">
        {user ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a comment..."
              maxLength={2000}
              className="flex-1 min-w-0 h-11 rounded-full bg-white/[0.06] px-4 text-sm text-ink placeholder:text-ink-muted"
            />
            <button
              type="submit"
              disabled={!draft.trim() || posting}
              aria-label="Post comment"
              className={`w-11 h-11 shrink-0 rounded-full bg-white/[0.10] flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 disabled:opacity-45 disabled:cursor-default ${
                draft.trim() && !posting ? "text-ink" : "text-ink-muted"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        ) : (
          <p className="text-sm text-ink-muted px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis">
            <Link href="/login" className="text-ink-dim hover:text-lamp underline transition-colors">
              Sign in
            </Link>{" "}
            to comment
          </p>
        )}
      </div>

      {/* Like / save / share circles */}
      <button
        onClick={onToggleLike}
        aria-label={liked ? "Unlike" : "Like"}
        className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 ${
          liked ? "bg-like/10 text-like" : "bg-white/[0.06] text-ink-dim"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={liked ? 0 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      <button
        onClick={onToggleSave}
        aria-label={saved ? "Unsave" : "Save"}
        className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 ${
          saved ? "bg-save/10 text-save" : "bg-white/[0.06] text-ink-dim"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={saved ? 0 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-5 h-5 ${animatingSave ? "heart-pop" : ""}`}
          onAnimationEnd={onSaveAnimEnd}
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      <button
        onClick={onShare}
        aria-label="Share"
        className="w-11 h-11 shrink-0 rounded-full bg-white/[0.06] flex items-center justify-center text-ink-dim cursor-pointer transition-all duration-150 active:scale-95"
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
  )
}
