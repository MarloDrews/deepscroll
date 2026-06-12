"use client"

// Console comments surface — a full-height inspector panel sliding in from
// the right. Log-style entries: mono timestamp + username row, serif body.
// Input is a command line with a ">" prompt and a square SEND key.

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useAuth } from "@/app/lib/auth"
import { relativeTime } from "@/app/lib/relativeTime"
import { useComments } from "@/app/lib/useComments"
import VerifiedBadge from "@/components/VerifiedBadge"
import type { CommentsSheetViewProps } from "../types"

export default function ConsoleCommentsSheet({ postId, onClose, onCountChange }: CommentsSheetViewProps) {
  const { user } = useAuth()
  const { comments, posting, deletingId, postComment, deleteComment } = useComments(postId, onCountChange)
  const [draft, setDraft] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (await postComment(draft)) setDraft("")
  }

  if (!mounted) return null

  return createPortal(
    // Portals escape the page wrapper, so data-design must be set here.
    <div data-design="console" className="fixed inset-0 z-50" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-surface-0/70" />

      {/* Keep the panel inside the 430px phone frame on wide screens. */}
      <div className="absolute inset-0 max-w-[430px] mx-auto">
        <div
          className="console-panel-in absolute right-0 top-0 bottom-0 w-[88%] max-w-[380px] bg-surface-1 border-l border-edge flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-none flex items-center justify-between border-b border-edge pl-4 pr-1 h-12">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink-dim">
              COMMENTS &mdash; {comments.length}
            </p>
            <button
              onClick={onClose}
              aria-label="Close comments"
              className="w-11 h-11 flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors duration-150 cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Log entries */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] px-4">
            {comments.length === 0 ? (
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint text-center py-6">
                NO ENTRIES &mdash; 00
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border-b border-edge py-3">
                  <div className="flex items-center gap-2 font-mono text-[10px] text-ink-muted">
                    <span>{relativeTime(comment.created_at)}</span>
                    <span className="text-ink-dim">{comment.username}</span>
                    {comment.is_verified > 0 && <VerifiedBadge size={12} level={comment.is_verified} />}
                    {user?.username === comment.username && (
                      <button
                        onClick={() => deleteComment(comment.id)}
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
          </div>

          {/* Command-line input */}
          <div
            className="flex-none border-t border-edge px-3 py-2"
            style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
          >
            {user ? (
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
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
                  className="shrink-0 h-11 px-3 border border-edge-strong font-mono text-[10px] uppercase tracking-wider text-ink-dim disabled:opacity-45 cursor-pointer hover:bg-surface-2 transition-colors duration-150"
                >
                  SEND
                </button>
              </form>
            ) : (
              <p className="font-mono text-xs text-ink-muted py-3">
                <Link href="/login" className="text-ink-dim underline hover:text-ink transition-colors">
                  Sign in
                </Link>{" "}
                to comment
              </p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
