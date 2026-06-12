"use client"

// Console feed card — a full-width dossier panel: left rail with rotated
// format label, mono indexes, hairline-divided data strip, and a cell
// toolbar for actions. PostCard owns all behavior; this is view only.

import { fcNum, fcStr } from "@/types/post"
import type { PostCardViewProps } from "../types"

export default function ConsoleCard({
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
  // People and concepts share the layout; pick whichever field exists.
  const topLabel = fcStr(fc, "role") || fcStr(fc, "field")
  const title = fcStr(fc, "name") || fcStr(fc, "concept_name") || post.title
  const summary = fcStr(fc, "essence") || fcStr(fc, "one_line")
  const lifespan = fcStr(fc, "lifespan")
  const difficulty = fcNum(fc, "post_difficulty")
  const minutes = fcNum(fc, "post_reading_time_min")
  const portraitUrl =
    (fc?.portrait as { image_url?: string } | undefined)?.image_url
  const teasers = Array.isArray(fc?.teasers) ? (fc.teasers as string[]) : []

  return (
    <div className="h-full flex flex-col justify-center pt-12 pb-24">
      {/* Panel reaches both screen edges: top/bottom hairlines only. */}
      <div
        className={`border-y border-edge bg-surface-1 transition-all duration-300 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        <div className="flex items-stretch">
          {/* Left rail: index tick in the format ink + rotated mono label. */}
          <div className="w-9 shrink-0 border-r border-edge flex flex-col items-center justify-between py-3">
            <span className="w-2 h-2 shrink-0 bg-(--accent)" aria-hidden="true" />
            <span className="console-vertical font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
              {style.badge}
            </span>
          </div>

          {/* Main column */}
          <div className="flex-1 min-w-0 px-5 py-5 flex flex-col gap-4">
            {/* Mono field/role label + squared author initial cell */}
            {(topLabel || post.author_username) && (
              <div className="flex items-start justify-between gap-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                  {topLabel}
                </p>
                {post.author_username && (
                  <span className="w-6 h-6 shrink-0 border border-edge-strong flex items-center justify-center font-mono text-[11px] uppercase text-ink-dim">
                    {post.author_username[0]}
                  </span>
                )}
              </div>
            )}

            {/* Title + squared portrait (people only) */}
            <div className="flex items-start gap-4">
              <h2 className="flex-1 min-w-0 font-serif text-3xl font-medium tracking-tight text-ink leading-snug">
                {title}
              </h2>
              {portraitUrl && (
                <div className="shrink-0 w-20 h-24 overflow-hidden bg-surface-2 border border-edge">
                  <img
                    src={portraitUrl}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                  />
                </div>
              )}
            </div>

            {summary && (
              <p className="font-serif text-base text-ink-body leading-relaxed">{summary}</p>
            )}

            {/* Teasers as a numbered mono list */}
            {teasers.length > 0 && (
              <ol className="space-y-1.5">
                {teasers.map((teaser, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="font-mono text-[10px] text-ink-muted mt-0.5 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm text-ink-dim leading-snug">{teaser}</span>
                  </li>
                ))}
              </ol>
            )}

            {/* Interest tags as one mono line */}
            {post.interests.length > 0 && (
              <p className="font-mono text-[10px] uppercase tracking-wide text-ink-muted truncate">
                TAGS: {post.interests.join(" / ")}
              </p>
            )}
          </div>
        </div>

        {/* Data strip: hairline-divided mono cells */}
        {(difficulty > 0 || minutes > 0 || lifespan) && (
          <div className="flex items-stretch border-t border-edge divide-x divide-edge font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            {difficulty > 0 && <span className="px-4 py-2">LV {difficulty}</span>}
            {minutes > 0 && <span className="px-4 py-2">{minutes} MIN</span>}
            {lifespan && <span className="px-4 py-2">{lifespan}</span>}
          </div>
        )}

        {/* Action toolbar: four hairline-divided cells. Handlers arrive
            pre-wrapped with stopPropagation from PostCard. */}
        <div className="grid grid-cols-4 divide-x divide-edge border-t border-edge">
          <button
            onClick={onToggleLike}
            aria-label={liked ? "Unlike" : "Like"}
            className="min-h-[44px] flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-dim cursor-pointer transition-colors duration-150 hover:bg-surface-2 active:bg-surface-2"
          >
            {liked && (
              <span
                className={`w-2 h-2 shrink-0 bg-like ${animatingLike ? "console-pulse" : ""}`}
                onAnimationEnd={onLikeAnimEnd}
                aria-hidden="true"
              />
            )}
            <span>LIKE{likesCount > 0 ? ` ${likesCount}` : ""}</span>
          </button>

          <button
            onClick={onOpenComments}
            aria-label="Comments"
            className="min-h-[44px] flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-dim cursor-pointer transition-colors duration-150 hover:bg-surface-2 active:bg-surface-2"
          >
            <span>COMMENTS{commentsCount > 0 ? ` ${commentsCount}` : ""}</span>
          </button>

          <button
            onClick={onSave}
            aria-label={saved ? "Unsave" : "Save"}
            className="min-h-[44px] flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-dim cursor-pointer transition-colors duration-150 hover:bg-surface-2 active:bg-surface-2"
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
            className="min-h-[44px] flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-dim cursor-pointer transition-colors duration-150 hover:bg-surface-2 active:bg-surface-2"
          >
            <span>SHARE</span>
          </button>
        </div>
      </div>
    </div>
  )
}
