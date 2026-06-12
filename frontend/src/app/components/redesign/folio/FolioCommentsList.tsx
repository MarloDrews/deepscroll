"use client"

// Folio inline comments list on the detail page: endnotes under a serif
// small-caps "Notes" heading, matching the full-screen notes page.

import type { CommentsListProps } from "../types"
import { FolioEndnote } from "./FolioEndnotes"

export default function FolioCommentsList({
  comments,
  currentUsername,
  onDelete,
  deletingId,
}: CommentsListProps) {
  return (
    <section className="px-6 mt-10">
      <div className="border-t border-edge pt-5">
        <p className="font-serif text-xs uppercase tracking-[0.25em] text-ink-dim">
          Notes
          {comments.length > 0 && (
            <span className="text-ink-muted"> &middot; {comments.length}</span>
          )}
        </p>
      </div>
      {comments.length === 0 ? (
        <p className="font-serif italic text-sm text-ink-muted py-6">No notes yet</p>
      ) : (
        <div className="mt-2">
          {comments.map((comment) => (
            <FolioEndnote
              key={comment.id}
              comment={comment}
              canDelete={currentUsername === comment.username}
              onDelete={() => onDelete(comment.id)}
              deleting={deletingId === comment.id}
            />
          ))}
        </div>
      )}
    </section>
  )
}
