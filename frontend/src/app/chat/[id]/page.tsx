"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Avatar from "@/components/Avatar"
import Spinner from "@/components/Spinner"
import { apiFetch } from "@/app/lib/api"
import { useAuth } from "@/app/lib/auth"
import {
  MESSAGE_MAX_CHARS,
  useChatSocket,
  type ChatMessage,
  type Conversation,
} from "@/app/lib/chatSocket"

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const conversationId = Number(params.id)
  const { user, loading: authLoading } = useAuth()

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[] | null>(null)
  const [draft, setDraft] = useState("")
  const [notFound, setNotFound] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const onSocketMessage = useCallback(
    (m: ChatMessage) => {
      if (m.conversation_id !== conversationId) return
      setMessages((prev) => {
        if (prev === null) return prev
        if (prev.some((existing) => existing.id === m.id)) return prev
        return [...prev, m]
      })
    },
    [conversationId]
  )
  const { status, error, send, clearError } = useChatSocket(onSocketMessage)

  useEffect(() => {
    if (authLoading || !user || !Number.isFinite(conversationId)) return
    apiFetch(`/api/chat/conversations/${conversationId}/messages`).then(async (r) => {
      if (!r.ok) {
        setNotFound(true)
        return
      }
      setMessages(await r.json())
    })
    // There is no single-conversation endpoint; the list is small, find the entry.
    apiFetch("/api/chat/conversations").then(async (r) => {
      if (!r.ok) return
      const list: Conversation[] = await r.json()
      setConversation(list.find((c) => c.id === conversationId) ?? null)
    })
  }, [authLoading, user, conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant", block: "end" })
  }, [messages?.length])

  function handleSend() {
    const body = draft.trim()
    if (!body || body.length > MESSAGE_MAX_CHARS) return
    if (send(conversationId, body)) {
      setDraft("")
      clearError()
    }
  }

  if (!authLoading && !user) {
    return (
      <div className="h-[100dvh] bg-zinc-950 flex flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-white font-semibold">Log in to see your messages</p>
        <Link href="/login" className="bg-white text-zinc-950 rounded-xl px-5 py-2 text-sm font-semibold">
          Log in
        </Link>
      </div>
    )
  }

  const headerAvatarUser = conversation && !conversation.is_group
    ? conversation.participants.find((p) => p.username !== user?.username)
    : null

  return (
    <div className="h-[100dvh] bg-zinc-950 flex justify-center">
      <div className="w-full max-w-[430px] h-[100dvh] flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-edge">
          <button
            onClick={() => router.push("/chat")}
            className="shrink-0 w-9 h-9 flex items-center justify-center text-zinc-400"
            aria-label="Back to chats"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          {headerAvatarUser && (
            <Avatar username={headerAvatarUser.username} avatarUrl={headerAvatarUser.avatar_url} size={32} />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{conversation?.name ?? "Chat"}</p>
            {conversation?.is_group && (
              <p className="text-zinc-600 text-xs truncate">
                {conversation.participants.map((p) => `@${p.username}`).join(", ")}
              </p>
            )}
          </div>
          {status !== "open" && (
            <span className="text-zinc-600 text-xs shrink-0">
              {status === "connecting" ? "connecting…" : "offline"}
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {notFound ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-zinc-500 text-sm">Conversation not found.</p>
            </div>
          ) : messages === null ? (
            <div className="flex-1 flex items-center justify-center">
              <Spinner />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-zinc-500 text-sm">Say hello</p>
            </div>
          ) : (
            messages.map((m, i) => {
              const own = m.sender_username === user?.username
              const showSender =
                !own &&
                conversation?.is_group &&
                (i === 0 || messages[i - 1].sender_username !== m.sender_username)
              return (
                <div key={m.id} className={`flex flex-col ${own ? "items-end" : "items-start"}`}>
                  {showSender && (
                    <p className="text-zinc-500 text-xs px-2 pt-1">@{m.sender_username}</p>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
                      own ? "bg-white text-zinc-950" : "bg-zinc-800 text-zinc-100"
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="px-3 py-2 border-t border-edge"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
        >
          {error && <p className="text-red-400 text-xs pb-1.5">{error}</p>}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Message…"
              rows={1}
              maxLength={MESSAGE_MAX_CHARS}
              className="flex-1 bg-zinc-900 rounded-xl text-white placeholder:text-zinc-500 text-sm px-4 py-2.5 focus:outline-none resize-none max-h-32"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || status !== "open" || notFound}
              className="shrink-0 w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center disabled:opacity-40"
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
