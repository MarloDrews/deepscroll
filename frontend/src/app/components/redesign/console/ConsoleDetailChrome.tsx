"use client"

// Console detail chrome — squared back button, dossier cover sheet header,
// command-line action bar, and log-style comments list. The detail page
// owns all behavior and passes it in through the slot props.

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/app/lib/auth"
import { relativeTime } from "@/app/lib/relativeTime"
import VerifiedBadge from "@/components/VerifiedBadge"
import type {
  CommentsListProps,
  DetailBackProps,
  DetailBarProps,
  DetailHeaderProps,
} from "../types"

// Two-digit dossier code per format, matching the feed tab indexes.
const FORMAT_CODE: Record<string, string> = {
  books: "02",
  facts: "03",
  people: "04",
  concepts: "05",
  questions: "06",
  stories: "07",
  academy: "08",
}

export function ConsoleDetailBack({ onClose }: DetailBackProps) {
  return (
    <button
      onClick={onClose}
      aria-label="Go back"
      className="absolute top-4 left-4 z-10 w-11 h-11 flex items-center justify-center border border-edge-strong bg-surface-0/80 backdrop-blur-sm text-ink-dim hover:text-ink transition-colors duration-150 cursor-pointer"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )
}

export function ConsoleDetailHeader({ post, style }: DetailHeaderProps) {
  const portraitUrl =
    (post.feed_card?.portrait as { image_url?: string } | undefined)?.image_url

  return (
    <div className="px-6 pb-6">
      {/* Index row: format ink only on the small square tick */}
      <div className="flex items-center gap-2 border-b border-edge pb-3 mb-4">
        <span className="w-2 h-2 shrink-0 bg-(--accent)" aria-hidden="true" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          {style.badge} / {FORMAT_CODE[post.format] ?? "00"}
        </span>
      </div>

      {/* Squared portrait (people only) */}
      {portraitUrl && (
        <div className="mb-4 w-28 h-32 overflow-hidden bg-surface-2 border border-edge">
          <img
            src={portraitUrl}
            alt=""
            className="w-full h-full object-cover object-top"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
          />
        </div>
      )}

      {/* Title */}
      <h1 className="font-serif text-3xl font-medium text-ink leading-snug mb-4">
        {post.title}
      </h1>

      {/* Attribution as a hairline-divided data strip */}
      <div className="flex items-stretch border-y border-edge divide-x divide-edge font-mono text-[10px] uppercase tracking-wider text-ink-muted mb-4">
        <span className="px-3 py-2 flex items-center shrink-0">SOURCE</span>
        <span className="px-3 py-2 flex items-center gap-1.5 min-w-0">
          {post.is_user_content && post.author_username ? (
            <>
              <Link
                href={`/profile/${post.author_username}`}
                className="normal-case text-ink-dim hover:text-ink transition-colors truncate"
              >
                @{post.author_username}
              </Link>
              {post.author_is_verified != null && post.author_is_verified > 0 && (
                <VerifiedBadge size={12} level={post.author_is_verified} />
              )}
            </>
          ) : !post.is_user_content ? (
            <>
              <span>DEEPSCROLL</span>
              <VerifiedBadge size={12} variant="official" />
            </>
          ) : null}
        </span>
      </div>

      {/* Interest tags as one mono line */}
      {post.interests.length > 0 && (
        <p className="font-mono text-[10px] uppercase tracking-wide text-ink-muted">
          TAGS: {post.interests.join(" / ")}
        </p>
      )}

      {/* Bottom hairline before the sections */}
      <div className="border-b border-edge mt-4" />
    </div>
  )
}

export function ConsoleDetailBar({
  posting,
  onSubmitComment,
  liked,
  likesCount,
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
    setDraft("")
    await onSubmitComment(body)
  }

  return (
    <div
      className="flex-none border-t border-edge bg-surface-0/95 backdrop-blur-md"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
    >
      <div className="flex items-stretch divide-x divide-edge">
        {/* Command-line input cell */}
        <div className="flex-1 min-w-0 min-h-[44px] flex items-center px-3">
          {user ? (
            <form onSubmit={handleSubmit} className="flex-1 min-w-0 flex items-center gap-2">
              <span className="font-mono text-sm text-ink-muted shrink-0">&gt;</span>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Comment"
                maxLength={2000}
                className="flex-1 min-w-0 h-11 bg-transparent font-mono text-sm text-ink placeholder:text-ink-muted"
              />
              <button
                type="submit"
                disabled={!draft.trim() || posting}
                className="shrink-0 h-11 px-2.5 border border-edge-strong font-mono text-[10px] uppercase tracking-wider text-ink-dim disabled:opacity-45 cursor-pointer hover:bg-surface-2 transition-colors duration-150"
              >
                SEND
              </button>
            </form>
          ) : (
            <p className="font-mono text-xs text-ink-muted">
              <Link href="/login" className="text-ink-dim underline hover:text-ink transition-colors">
                Sign in
              </Link>{" "}
              to comment
            </p>
          )}
        </div>

        {/* Action cells with state squares */}
        <button
          onClick={onToggleLike}
          aria-label={liked ? "Unlike" : "Like"}
          className="min-h-[44px] px-3 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-dim cursor-pointer transition-colors duration-150 hover:bg-surface-2 active:bg-surface-2"
        >
          {liked && <span className="w-2 h-2 shrink-0 bg-like" aria-hidden="true" />}
          <span>LIKE{likesCount > 0 ? ` ${likesCount}` : ""}</span>
        </button>

        <button
          onClick={onToggleSave}
          aria-label={saved ? "Unsave" : "Save"}
          className="min-h-[44px] px-3 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-dim cursor-pointer transition-colors duration-150 hover:bg-surface-2 active:bg-surface-2"
        >
          {saved && (
            <span
              className={`w-2 h-2 shrink-0 bg-save ${animatingSave ? "console-pulse" : ""}`}
              onAnimationEnd={onSaveAnimEnd}
              aria-hidden="true"
            />
          )}
          <span>SAVE</span>
        </button>

        <button
          onClick={onShare}
          aria-label="Share"
          className="min-h-[44px] px-3 flex items-center justify-center font-mono text-[10px] uppercase tracking-wider text-ink-dim cursor-pointer transition-colors duration-150 hover:bg-surface-2 active:bg-surface-2"
        >
          <span>SHARE</span>
        </button>
      </div>
    </div>
  )
}

export function ConsoleCommentsList({
  comments,
  currentUsername,
  onDelete,
  deletingId,
}: CommentsListProps) {
  return (
    <section className="px-6 mt-8">
      <p className="font-mono text-[11px] uppercase tracking-widest text-ink-dim border-b border-edge pb-2">
        COMMENTS &mdash; {comments.length}
      </p>
      {comments.length === 0 ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint py-4">
          NO ENTRIES &mdash; 00
        </p>
      ) : (
        comments.map((comment) => (
          <div key={comment.id} className="border-b border-edge py-3">
            <div className="flex items-center gap-2 font-mono text-[10px] text-ink-muted">
              <span>{relativeTime(comment.created_at)}</span>
              <span className="text-ink-dim">{comment.username}</span>
              {comment.is_verified > 0 && <VerifiedBadge size={12} level={comment.is_verified} />}
              {currentUsername === comment.username && (
                <button
                  onClick={() => onDelete(comment.id)}
                  disabled={deletingId === comment.id}
                  aria-label="Delete comment"
                  className="ml-auto px-2 py-2 -my-2 font-mono text-[10px] uppercase tracking-wider text-bad cursor-pointer disabled:opacity-45 hover:bg-surface-2 transition-colors duration-150"
                >
                  {deletingId === comment.id ? "..." : "DEL"}
                </button>
              )}
            </div>
            <p className="font-serif text-sm text-ink-body leading-relaxed mt-1">{comment.body}</p>
          </div>
        ))
      )}
    </section>
  )
}
