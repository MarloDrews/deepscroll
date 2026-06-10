"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { type Post } from "@/app/components/PostCard"
import { fcStr } from "@/types/post"
import { FORMAT_IDS, FORMAT_STYLES, type FormatId } from "@/lib/formats"
import { apiFetch } from "@/app/lib/api"
import { useAuth } from "@/app/lib/auth"
import BottomNav from "@/app/components/BottomNav"
import VerifiedBadge from "@/components/VerifiedBadge"
import Avatar from "@/components/Avatar"
import Spinner from "@/components/Spinner"

const FORMAT_CHIPS: { label: string; value: FormatId | "" }[] = [
  { label: "All", value: "" },
  ...FORMAT_IDS.map((id) => ({ label: FORMAT_STYLES[id].label, value: id })),
]

type FormatValue = FormatId | ""
type Scope = "posts" | "accounts"

interface UserResult {
  username: string
  is_verified: boolean
  is_private: boolean
  bio: string | null
  avatar_url: string | null
  is_self: boolean
  follow_status: string | null
}

function Snippet({ post }: { post: Post }) {
  const text = fcStr(post.feed_card, "essence") || fcStr(post.feed_card, "headline")
  const snippet = text.length > 120 ? text.slice(0, 120) + "…" : text
  return <p className="text-ink-dim text-xs mt-1 line-clamp-2">{snippet}</p>
}

function FormatBadge({ format }: { format: string }) {
  const style = FORMAT_STYLES[format as FormatId]
  if (!style) return null
  return (
    <span className={`label-caps ${style.text}`}>
      {style.badge}
    </span>
  )
}

function UserRow({ user, loggedIn }: { user: UserResult; loggedIn: boolean }) {
  const router = useRouter()
  const [followStatus, setFollowStatus] = useState(user.follow_status)
  const [busy, setBusy] = useState(false)

  async function toggleFollow(e: React.MouseEvent) {
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    try {
      if (followStatus === "accepted" || followStatus === "pending") {
        await apiFetch(`/api/users/${user.username}/follow`, { method: "DELETE" })
        setFollowStatus("none")
      } else {
        const r = await apiFetch(`/api/users/${user.username}/follow`, { method: "POST" })
        if (r.ok) {
          const d = await r.json()
          setFollowStatus(d.status)
        }
      }
    } finally {
      setBusy(false)
    }
  }

  const following = followStatus === "accepted"
  const requested = followStatus === "pending"

  return (
    <button
      onClick={() => router.push(`/profile/${user.username}`)}
      className="w-full text-left card px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-surface-2 transition-colors duration-150"
    >
      <Avatar username={user.username} avatarUrl={user.avatar_url} size={44} />
      <div className="flex-1 min-w-0">
        <p className="flex items-center gap-1.5 text-ink text-sm font-semibold truncate">
          @{user.username}
          {user.is_verified && <VerifiedBadge size={14} />}
        </p>
        {user.bio && <p className="text-ink-muted text-xs truncate">{user.bio}</p>}
        {user.is_private && !user.bio && <p className="text-ink-faint text-xs">Private account</p>}
      </div>
      {loggedIn && !user.is_self && (
        <span
          onClick={toggleFollow}
          role="button"
          className={`btn shrink-0 px-3 py-1.5 text-xs ${busy ? "opacity-50" : ""} ${
            following || requested
              ? "btn-ghost"
              : "btn-primary"
          }`}
        >
          {following ? "Following" : requested ? "Requested" : "Follow"}
        </span>
      )}
    </button>
  )
}

export default function SearchPage() {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const [query, setQuery] = useState("")
  const [scope, setScope] = useState<Scope>("posts")
  const [formatFilter, setFormatFilter] = useState<FormatValue>("")
  const [results, setResults] = useState<Post[] | null>(null)
  const [userResults, setUserResults] = useState<UserResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults(null)
      setUserResults(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        if (scope === "posts") {
          const params = new URLSearchParams({ q: trimmed })
          if (formatFilter) params.set("format", formatFilter)
          const res = await apiFetch(`/api/search?${params}`)
          const data: Post[] = await res.json()
          setResults(data)
        } else {
          const res = await apiFetch(`/api/search/users?${new URLSearchParams({ q: trimmed })}`)
          const data: UserResult[] = await res.json()
          setUserResults(data)
        }
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, formatFilter, scope])

  const hasQuery = !!query.trim()
  const emptyPosts = scope === "posts" && results !== null && results.length === 0
  const emptyUsers = scope === "accounts" && userResults !== null && userResults.length === 0

  return (
    <div className="h-[100dvh] bg-surface-0 flex justify-center">
      <div className="w-full max-w-[430px] h-[100dvh] relative">

        {/* Top bar: back + search input */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-surface-0 px-3 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="shrink-0 w-9 h-9 flex items-center justify-center text-ink-dim hover:text-ink transition-colors duration-150 cursor-pointer"
              aria-label="Go back"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <div className="relative flex-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={scope === "posts" ? "Search posts, books, questions…" : "Search accounts…"}
                className="field text-sm pl-9 pr-9 py-2.5"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Scope toggle: Posts | Accounts */}
          <div className="flex gap-2 mt-2">
            {(["posts", "accounts"] as Scope[]).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`flex-1 rounded-field py-1.5 text-xs font-semibold capitalize cursor-pointer transition-colors duration-150 ${
                  scope === s ? "bg-surface-3 text-ink" : "bg-surface-1 text-ink-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Format chips (posts scope only) */}
          {scope === "posts" && (
            <div className="flex gap-2 mt-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] pb-1">
              {FORMAT_CHIPS.map((chip) => {
                const isActive = formatFilter === chip.value
                const style = chip.value ? FORMAT_STYLES[chip.value] : null
                return (
                  <button
                    key={chip.value}
                    onClick={() => setFormatFilter(chip.value)}
                    className={`chip shrink-0 px-3 py-1 text-xs ${
                      isActive
                        ? style
                          ? `bg-surface-3 border-edge-strong ${style.text}`
                          : "chip-on"
                        : "chip-off"
                    }`}
                  >
                    {chip.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Results area */}
        <div className={`absolute inset-0 ${scope === "posts" ? "top-[148px]" : "top-[112px]"} overflow-y-auto pb-14 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] px-3`}>
          {loading ? (
            <div className="flex justify-center pt-16">
              <Spinner />
            </div>
          ) : !hasQuery ? (
            <div className="flex flex-col items-center justify-center pt-20 text-center px-6">
              <p className="text-ink-muted text-sm">
                {scope === "posts" ? "Search posts, books, questions…" : "Find people to follow"}
              </p>
            </div>
          ) : emptyPosts || emptyUsers ? (
            <div className="flex flex-col items-center justify-center pt-20 text-center px-6 gap-2">
              <p className="text-ink font-serif font-medium text-base">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-ink-muted text-xs">
                {scope === "posts" ? "Try a different word or format" : "Try a different username"}
              </p>
            </div>
          ) : scope === "accounts" && userResults !== null ? (
            <div className="flex flex-col gap-2 pt-2">
              {userResults.map((u) => (
                <UserRow key={u.username} user={u} loggedIn={!!authUser} />
              ))}
            </div>
          ) : scope === "posts" && results !== null ? (
            <div className="flex flex-col gap-2 pt-2">
              {results.map((post) => (
                <button
                  key={post.id}
                  onClick={() => router.push(`/post/${post.id}`)}
                  className="w-full text-left card px-4 py-3 cursor-pointer hover:bg-surface-2 transition-colors duration-150"
                >
                  <FormatBadge format={post.format} />
                  <p className="text-ink font-serif font-medium text-[15px] mt-0.5 line-clamp-2">{post.title}</p>
                  <p className="flex items-center gap-1 text-ink-faint text-xs mt-0.5">
                    {post.is_user_content && post.author_username ? (
                      <Link href={`/profile/${post.author_username}`} className="hover:text-ink-dim transition-colors" onClick={(e) => e.stopPropagation()}>
                        @{post.author_username}
                      </Link>
                    ) : "Deepscroll"}
                    {post.is_user_content && post.author_is_verified && <VerifiedBadge size={14} />}
                  </p>
                  <Snippet post={post} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <BottomNav activeTab="search" />
      </div>
    </div>
  )
}
