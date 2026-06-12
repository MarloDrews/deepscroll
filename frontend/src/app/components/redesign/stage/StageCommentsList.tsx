"use client"

// Stage detail-page comments list — chat-bubble rows matching the sheet.

import StageCommentRow from "./StageCommentRow"
import type { CommentsListProps } from "../types"

export default function StageCommentsList({
  comments,
  currentUsername,
  onDelete,
  deletingId,
}: CommentsListProps) {
  return (
    <section className="px-6 pt-8">
      <div className="flex items-baseline gap-2 mb-4">
        <h2 className="font-serif text-lg text-ink">Comments</h2>
        <span className="text-xs font-mono text-ink-muted">{comments.length}</span>
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-ink-faint">No comments yet</p>
      ) : (
        comments.map((comment) => (
          <StageCommentRow
            key={comment.id}
            comment={comment}
            isOwn={currentUsername === comment.username}
            deleting={deletingId === comment.id}
            onDelete={onDelete}
          />
        ))
      )}
    </section>
  )
}
