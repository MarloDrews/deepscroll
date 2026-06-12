"use client"

// Folio comments surface: not a bottom sheet but a full-screen "Notes" page
// that slides in from the right like turning a page. Portal root carries
// data-design="folio" because portals escape the scoped page wrapper.

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useAuth } from "@/app/lib/auth"
import { useComments } from "@/app/lib/useComments"
import type { CommentsSheetViewProps } from "../types"
import { FolioEndnote } from "./FolioEndnotes"

export default function FolioCommentsSheet({ postId, onClose, onCountChange }: CommentsSheetViewProps) {
  const { user } = useAuth()
  const { comments, posting, deletingId, postComment, deleteComment } = useComments(postId, onCountChange)
  const [draft, setDraft] = useState("")
  const [mounted, setMounted] = useState(false)
  // Closing plays the slide-out animation first; onClose fires on its end.
  const [closing, setClosing] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  function startClose() {
    if (!closing) setClosing(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (await postComment(draft)) setDraft("")
  }

  if (!mounted) return null

  return createPortal(
    <div data-design="folio" className="fixed inset-0 z-50" onClick={startClose}>
      {/* Dim the page underneath while the notes page is open. */}
      <div className="absolute inset-0 bg-surface-0/60" />

      {/* The page itself; animations in detail.css carry the reduced-motion
          guard (1ms duration, so onAnimationEnd still fires). */}
      <div
        className={`absolute inset-0 max-w-[430px] mx-auto bg-surface-0 border-l border-r border-edge flex flex-col ${
          closing ? "folio-page-exit" : "folio-page-enter"
        }`}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={() => { if (closing) onClose() }}
      >
        {/* Header */}
        <div className="flex-none h-14 flex items-center justify-between border-b border-edge pl-6 pr-1">
          <h2 className="font-serif text-lg text-ink">
            Notes
            {comments.length > 0 && (
              <span className="text-ink-muted text-sm"> &middot; {comments.length}</span>
            )}
          </h2>
          <button
            onClick={startClose}
            aria-label="Close notes"
            className="w-11 h-11 flex items-center justify-center text-ink-dim hover:text-ink transition-colors duration-150 cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              className="w-5 h-5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Endnotes */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] px-6 py-2">
          {comments.length === 0 ? (
            <p className="font-serif italic text-sm text-ink-muted text-center py-10">
              No notes yet
            </p>
          ) : (
            comments.map((comment) => (
              <FolioEndnote
                key={comment.id}
                comment={comment}
                canDelete={user?.username === comment.username}
                onDelete={() => deleteComment(comment.id)}
                deleting={deletingId === comment.id}
              />
            ))
          )}
        </div>

        {/* Underlined input */}
        <div
          className="flex-none border-t border-edge px-6 pt-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
        >
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
            <p className="text-sm text-ink-muted text-center py-1">
              <Link href="/login" className="text-ink-dim hover:text-ink underline transition-colors">
                Sign in
              </Link>{" "}
              to comment
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
