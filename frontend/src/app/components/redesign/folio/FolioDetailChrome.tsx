"use client"

// Folio post detail chrome: bare back glyph, a book title page header, and a
// hairline-top sticky bar with an underlined input and text actions.

import { useState } from "react"
import Link from "next/link"
import VerifiedBadge from "@/components/VerifiedBadge"
import { useAuth } from "@/app/lib/auth"
import { fcStr } from "@/types/post"
import type { DetailBackProps, DetailBarProps, DetailHeaderProps } from "../types"

export function FolioDetailBack({ onClose }: DetailBackProps) {
  return (
    <button
      onClick={onClose}
      aria-label="Go back"
      className="absolute top-2 left-2 z-10 w-11 h-11 flex items-center justify-center text-ink-dim hover:text-ink transition-colors duration-150 cursor-pointer"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )
}

// Title page: everything centered, structured by hairlines and type only.
export function FolioDetailHeader({ post, style }: DetailHeaderProps) {
  const author = post.format === "books" ? fcStr(post.feed_card, "author") : ""
  const coverUrl = post.format === "books" ? fcStr(post.feed_card, "cover_url") : ""

  return (
    <div className="px-6 pb-8 text-center">
      {/* Running head in the format ink, over a short hairline. */}
      <p className={`font-serif text-[0.6875rem] uppercase tracking-[0.3em] ${style.text}`}>
        {style.badge}
      </p>
      <div className="mx-auto mt-3 w-16 border-t border-edge" />

      {coverUrl && (
        <div className="flex justify-center mt-7">
          <div className="w-28 h-44 bg-surface-2 border border-edge overflow-hidden">
            <img
              src={coverUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
            />
          </div>
        </div>
      )}

      <h1 className="font-serif text-4xl text-ink leading-tight tracking-tight mt-7">
        {post.title}
      </h1>
      {author && <p className="font-serif italic text-base text-ink-dim mt-2">{author}</p>}

      {/* Imprint line — same attribution logic as the baseline header. */}
      <div className="flex items-center justify-center gap-1 mt-5 text-xs text-ink-muted">
        {post.is_user_content && post.author_username ? (
          <span className="flex items-center gap-1">
            Submitted by{" "}
            <Link
              href={`/profile/${post.author_username}`}
              className="hover:text-ink-body transition-colors"
            >
              @{post.author_username}
            </Link>
            {post.author_is_verified != null && post.author_is_verified > 0 && (
              <VerifiedBadge size={14} level={post.author_is_verified} />
            )}
          </span>
        ) : !post.is_user_content ? (
          <>
            <span>Deepscroll</span>
            <VerifiedBadge size={12} variant="official" />
          </>
        ) : null}
      </div>

      {/* Interest tags as a plain footnote line, no chips. */}
      {post.interests.length > 0 && (
        <p className="mt-4 text-xs text-ink-muted">{post.interests.join(" · ")}</p>
      )}

      {/* Closing hairline before the sections begin. */}
      <div className="mt-8 border-t border-edge" />
    </div>
  )
}

// Small-caps text action matching the feed card row.
function FolioBarAction({
  onClick,
  ariaLabel,
  active,
  activeClass,
  children,
}: {
  onClick: () => void
  ariaLabel: string
  active?: boolean
  activeClass?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`h-11 px-2 inline-flex items-center gap-1.5 cursor-pointer font-serif text-[0.6875rem] uppercase tracking-[0.18em] transition-colors duration-150 active:text-ink ${
        active ? activeClass : "text-ink-dim"
      }`}
    >
      {children}
    </button>
  )
}

export function FolioDetailBar({
  posting,
  onSubmitComment,
  liked,
  likesCount,
  commentCount,
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
      className="flex-none border-t border-edge bg-surface-0/90 backdrop-blur-md"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
    >
      <div className="px-6 pt-3">
        {user ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a note..."
              maxLength={2000}
              className="flex-1 min-w-0 bg-transparent border-b border-edge-strong pb-1.5 font-serif text-[0.9375rem] text-ink placeholder:text-ink-muted placeholder:italic focus:border-ink-dim transition-colors duration-150"
            />
            <button
              type="submit"
              disabled={!draft.trim() || posting}
              className="shrink-0 h-11 px-2 font-serif text-xs uppercase tracking-[0.18em] text-ink-dim hover:text-ink disabled:opacity-45 transition-colors duration-150 cursor-pointer"
            >
              Post
            </button>
          </form>
        ) : (
          <p className="text-sm text-ink-muted py-1">
            <Link href="/login" className="text-ink-dim hover:text-ink underline transition-colors">
              Sign in
            </Link>{" "}
            to comment
          </p>
        )}

        {/* Quiet action row matching the feed card. */}
        <div className="-ml-2 mt-1 flex items-center">
          <FolioBarAction
            onClick={onToggleLike}
            ariaLabel={liked ? "Unlike" : "Like"}
            active={liked}
            activeClass="text-like"
          >
            <svg
              viewBox="0 0 24 24"
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>Like{likesCount > 0 ? ` ${likesCount}` : ""}</span>
          </FolioBarAction>
          {commentCount > 0 && (
            <>
              <span aria-hidden className="text-ink-faint text-xs select-none">&middot;</span>
              <span className="px-2 font-serif text-[0.6875rem] uppercase tracking-[0.18em] text-ink-muted">
                Notes {commentCount}
              </span>
            </>
          )}
          <span aria-hidden className="text-ink-faint text-xs select-none">&middot;</span>
          <FolioBarAction
            onClick={onToggleSave}
            ariaLabel={saved ? "Unsave" : "Save"}
            active={saved}
            activeClass="text-save"
          >
            <svg
              viewBox="0 0 24 24"
              fill={saved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-4 h-4 ${animatingSave ? "heart-pop" : ""}`}
              onAnimationEnd={onSaveAnimEnd}
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span>Save</span>
          </FolioBarAction>
          <span aria-hidden className="text-ink-faint text-xs select-none">&middot;</span>
          <FolioBarAction onClick={onShare} ariaLabel="Share">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            <span>Share</span>
          </FolioBarAction>
        </div>
      </div>
    </div>
  )
}
