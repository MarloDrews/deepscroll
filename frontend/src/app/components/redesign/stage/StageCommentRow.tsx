"use client"

// Stage chat-style comment row — a frosted avatar circle next to a soft
// bubble. Shared by the comments sheet and the detail-page comments list.

import VerifiedBadge from "@/components/VerifiedBadge"
import { relativeTime } from "@/app/lib/relativeTime"
import type { Comment } from "@/app/components/CommentsSection"

interface StageCommentRowProps {
  comment: Comment
  isOwn: boolean
  deleting: boolean
  onDelete: (id: number) => void
}

export default function StageCommentRow({ comment, isOwn, deleting, onDelete }: StageCommentRowProps) {
  return (
    <div className="flex items-start gap-2.5 mb-3">
      {/* Avatar circle with the author's initial */}
      <div className="w-8 h-8 rounded-full bg-white/[0.06] backdrop-blur-md flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-xs font-semibold text-ink-dim uppercase">{comment.username[0]}</span>
      </div>

      {/* Bubble */}
      <div className="flex-1 min-w-0 rounded-2xl bg-surface-2 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-ink">{comment.username}</span>
          {comment.is_verified > 0 && <VerifiedBadge size={13} level={comment.is_verified} />}
          <span className="text-xs text-ink-muted">{relativeTime(comment.created_at)}</span>
          {isOwn && (
            <button
              onClick={() => onDelete(comment.id)}
              disabled={deleting}
              className="ml-auto text-xs text-ink-muted hover:text-bad transition-colors duration-150 cursor-pointer disabled:opacity-45 disabled:cursor-default"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
        <p className="text-sm text-ink-body mt-1 leading-relaxed">{comment.body}</p>
      </div>
    </div>
  )
}
