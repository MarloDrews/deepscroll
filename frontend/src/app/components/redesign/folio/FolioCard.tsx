"use client"

// Folio feed card: no card box. Content sits directly on surface-0 as a
// printed page — hairline running head, oversized serif title, footnote
// metadata, and a quiet baseline action row instead of a right rail.

import type { MouseEvent, ReactNode } from "react"
import { fcNum, fcStr } from "@/types/post"
import type { PostCardViewProps } from "../types"

// Tiny tinted dot scale for the metadata footnote. Filled dots take the
// per-format --accent set on the card wrapper; the only accent use besides
// the running head.
function FootnoteDots({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-px" aria-label={`Difficulty ${value} of 3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`text-[9px] leading-none ${i <= value ? "text-(--accent)" : "text-ink-faint"}`}>
          &bull;
        </span>
      ))}
    </span>
  )
}

// One small-caps text action. Provided handlers already stopPropagation, so
// taps never schedule the wrapper's delayed navigate. h-11 keeps the 44px
// touch target; press feedback is an ink shift, never a fill or glow.
function FolioAction({
  onClick,
  ariaLabel,
  active,
  activeClass,
  children,
}: {
  onClick: (e: MouseEvent) => void
  ariaLabel: string
  active?: boolean
  activeClass?: string
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`h-11 px-2 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer font-serif text-[0.6875rem] uppercase tracking-[0.18em] transition-colors duration-150 active:text-ink ${
        active ? activeClass : "text-ink-dim"
      }`}
    >
      {children}
    </button>
  )
}

function ActionSeparator() {
  return (
    <span aria-hidden className="text-ink-faint text-xs select-none">
      &middot;
    </span>
  )
}

export default function FolioCard({
  post,
  fc,
  style,
  visible,
  liked,
  likesCount,
  saved,
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
  const isBooks = post.format === "books"
  const title = (isBooks ? fcStr(fc, "title") : fcStr(fc, "headline")) || post.title
  const author = isBooks ? fcStr(fc, "author") : ""
  const essence = fcStr(fc, "essence")
  const field = fcStr(fc, "field")
  const teasers = Array.isArray(fc?.teasers) ? (fc.teasers as string[]) : []
  const difficulty = fcNum(fc, "post_difficulty")
  const readMin = fcNum(fc, "post_reading_time_min")
  const year = fcNum(fc, "year")
  const genre = fcStr(fc, "genre")

  // Tags and author initial fold into one faint footnote line.
  const footnoteParts = [...post.interests]
  if (post.author_username) footnoteParts.push(`@${post.author_username}`)

  // pb-20 keeps the footnotes and action row clear of the h-14 bottom nav.
  return (
    <div className="h-full flex flex-col px-7 pt-12 pb-20">
      {/* Running head over a hairline; the format word is the only accent. */}
      <div className="border-t border-edge pt-2.5 flex items-baseline gap-2">
        <span className={`font-serif text-[0.6875rem] uppercase tracking-[0.25em] ${style.text}`}>
          {style.badge}
        </span>
        {field && (
          <span className="font-serif text-[0.6875rem] uppercase tracking-[0.25em] text-ink-muted">
            &middot; {field}
          </span>
        )}
      </div>

      {/* Page body — vertical rhythm does the structural work. */}
      <div
        className={`flex-1 min-h-0 flex flex-col justify-center transition-all duration-500 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h2 className="font-serif text-4xl text-ink leading-[1.15] tracking-tight">{title}</h2>
        {author && <p className="font-serif text-base text-ink-dim mt-3">{author}</p>}
        {essence && (
          <p className="font-serif italic text-lg text-ink-body leading-relaxed mt-5">{essence}</p>
        )}
        {teasers.length > 0 && (
          <div className="mt-7 space-y-4">
            {teasers.map((teaser, i) => (
              <p key={i} className="font-serif text-base text-ink-body leading-relaxed">
                <span aria-hidden className="text-ink-muted">
                  &mdash;{" "}
                </span>
                {teaser}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Footnotes */}
      <div className="space-y-1.5">
        {footnoteParts.length > 0 && (
          <p className="font-mono text-[11px] text-ink-muted truncate">
            {footnoteParts.join(" · ")}
          </p>
        )}
        <p className="font-mono text-[11px] text-ink-muted flex items-center gap-2">
          {difficulty > 0 && <FootnoteDots value={difficulty} />}
          {readMin > 0 && <span>{readMin} min read</span>}
          {year > 0 && <span>{year}</span>}
          {genre && <span>{genre}</span>}
        </p>
      </div>

      {/* Baseline action row, bottom-left. */}
      <div className="mt-1 -ml-2 flex items-center flex-wrap">
        <FolioAction
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
            className={`w-4 h-4 ${animatingLike ? "heart-pop" : ""}`}
            onAnimationEnd={onLikeAnimEnd}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>Like{likesCount > 0 ? ` ${likesCount}` : ""}</span>
        </FolioAction>
        <ActionSeparator />
        <FolioAction onClick={onOpenComments} ariaLabel="Comments">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {/* "Notes" matches the folio comments surface and keeps the row on one line. */}
          <span>Notes{commentsCount > 0 ? ` ${commentsCount}` : ""}</span>
        </FolioAction>
        <ActionSeparator />
        <FolioAction
          onClick={onSave}
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
        </FolioAction>
        <ActionSeparator />
        <FolioAction onClick={onShare} ariaLabel="Share">
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
        </FolioAction>
      </div>
    </div>
  )
}
