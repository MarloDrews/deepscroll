"use client"

// One Folio endnote: hanging-indent comment entry shared by the Notes page
// (FolioCommentsSheet) and the inline detail list (FolioCommentsList).

import VerifiedBadge from "@/components/VerifiedBadge"
import { relativeTime } from "@/app/lib/relativeTime"
import type { Comment } from "@/app/components/CommentsSection"

export function FolioEndnote({
  comment,
  canDelete,
  onDelete,
  deleting,
}: {
  comment: Comment
  canDelete: boolean
  onDelete: () => void
  deleting: boolean
}) {
  return (
    <div className="folio-endnote border-b border-edge py-4 last:border-b-0">
      {/* Head row is pulled back to the margin (hanging indent, detail.css). */}
      <div className="folio-endnote-head flex items-center gap-2">
        <span className="font-serif text-xs uppercase tracking-[0.15em] text-ink">
          {comment.username}
        </span>
        {comment.is_verified > 0 && <VerifiedBadge size={12} level={comment.is_verified} />}
        <span className="text-[11px] text-ink-muted">{relativeTime(comment.created_at)}</span>
        {canDelete && (
          // Bare text button; negative margin extends the tap area without
          // inflating the row height.
          <button
            onClick={onDelete}
            disabled={deleting}
            className="ml-auto px-2 py-3 -my-3 text-xs text-bad cursor-pointer disabled:opacity-45 transition-opacity duration-150"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
      <p className="font-serif text-[0.9375rem] text-ink-body leading-relaxed mt-1">
        {comment.body}
      </p>
    </div>
  )
}
