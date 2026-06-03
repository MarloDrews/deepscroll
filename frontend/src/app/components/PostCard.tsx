"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import CommentsBottomSheet from "./CommentsBottomSheet"
import Toast from "./Toast"
import { queueEvent, hasPendingLike, cancelPendingLike } from "@/app/lib/eventQueue"
import { useWikipediaImage } from "@/app/lib/useWikipediaImage"
import { apiFetch } from "@/app/lib/api"
import { savePost, unsavePost, isPostSaved } from "@/app/lib/savedPosts"
import { likePost, unlikePost, isPostLiked, getCachedLikeCount, setCachedLikeCount, isLikeSent, markLikeSent, unmarkLikeSent } from "@/app/lib/likedPosts"

export interface Post {
  id: number
  format: string
  title: string
  body: string
  source: string | null
  hook: string | null
  key_points: string[] | null
  takeaway: string | null
  source_url: string | null
  image_url: string | null
  image_attribution: string | null
  related_slugs: string[] | null
  details: Record<string, unknown> | null
  interests: string[]
  author_username?: string | null
  status?: string
  is_user_content?: boolean
}

interface BookDetails {
  author?: string
  isbn?: string
  publication_year?: number
  core_thesis?: string
  who_should_read?: string
}

interface FactDetails {
  stat?: string
  context?: string
  why_it_matters?: string
  visual_svg?: string
  visual_type?: string
}

interface PersonDetails {
  lifespan?: string
  known_for?: string
  field?: string
  turning_point?: string
  legacy?: string
  wikipedia_url?: string
}

interface ConceptDetails {
  one_line_definition?: string
  explanation?: string
  concrete_example?: string
  how_to_apply?: string
  related_concepts?: string[]
  visual_svg?: string
  visual_type?: string
}

interface QuestionDetails {
  the_question?: string
  framing?: string
  perspectives?: string[]
  reflection_prompt?: string
}

export const FORMAT_STYLES = {
  books: {
    label: "BOOKS",
    dot: "bg-amber-400",
    text: "text-amber-400",
    glow: "from-amber-600/40",
    radial: "rgba(251,191,36,0.09)",
    accent: "#fbbf24",
  },
  facts: {
    label: "FACTS",
    dot: "bg-cyan-400",
    text: "text-cyan-400",
    glow: "from-cyan-500/40",
    radial: "rgba(34,211,238,0.09)",
    accent: "#22d3ee",
  },
  people: {
    label: "PEOPLE",
    dot: "bg-rose-400",
    text: "text-rose-400",
    glow: "from-rose-500/40",
    radial: "rgba(251,113,133,0.09)",
    accent: "#fb7185",
  },
  concepts: {
    label: "CONCEPTS",
    dot: "bg-violet-400",
    text: "text-violet-400",
    glow: "from-violet-500/40",
    radial: "rgba(167,139,250,0.09)",
    accent: "#a78bfa",
  },
  questions: {
    label: "QUESTIONS",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    glow: "from-emerald-500/40",
    radial: "rgba(52,211,153,0.09)",
    accent: "#34d399",
  },
  stories: {
    label: "STORIES",
    dot: "bg-orange-400",
    text: "text-orange-400",
    glow: "from-orange-500/40",
    radial: "rgba(251,146,60,0.09)",
    accent: "#fb923c",
  },
} as const

type Format = keyof typeof FORMAT_STYLES

const MIN_DWELL_MS = 500

function readTime(post: Post): string {
  const text =
    [post.hook, ...(post.key_points ?? []), post.takeaway].filter(Boolean).join(" ") ||
    post.body
  const words = text.trim().split(/\s+/).length
  const seconds = Math.ceil(words / (200 / 60))
  if (seconds < 60) return `${seconds} sec read`
  return `${Math.ceil(seconds / 60)} min read`
}

function hookText(post: Post): string {
  if (post.format === "concepts") {
    const d = (post.details ?? {}) as ConceptDetails
    return d.one_line_definition ?? post.hook ?? post.body.slice(0, 120)
  }
  return post.hook ?? post.body.slice(0, 120)
}

export default function PostCard({ post, activeTabId }: { post: Post; activeTabId: string }) {
  const router = useRouter()
  const cardRef           = useRef<HTMLDivElement>(null)
  const viewStartRef      = useRef<number | null>(null)
  const lastTapRef        = useRef<number>(0)
  const navTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const likeInteractedRef = useRef(false)

  const [visible, setVisible] = useState(false)
  const [liked, setLiked] = useState(() => isPostLiked(post.id))
  const [likesCount, setLikesCount] = useState(() =>
    getCachedLikeCount(post.id) ?? (isPostLiked(post.id) ? 1 : 0)
  )
  const [commentsCount, setCommentsCount] = useState(0)
  const [saved, setSaved] = useState(() => isPostSaved(post.id))
  const [saveCount, setSaveCount] = useState(0)
  const [animatingSave, setAnimatingSave] = useState(false)
  const [animatingLike, setAnimatingLike] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showHeartAnim, setShowHeartAnim] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)

  const style = FORMAT_STYLES[post.format as Format] ?? FORMAT_STYLES.facts

  const pd = (post.details ?? {}) as PersonDetails
  const fd = (post.details ?? {}) as FactDetails
  const bd = (post.details ?? {}) as BookDetails
  const qd = (post.details ?? {}) as QuestionDetails
  const cd = (post.details ?? {}) as ConceptDetails

  const { imageUrl: wikiThumb } = useWikipediaImage(
    post.format === "people" && !post.image_url ? pd.wikipedia_url : null,
    "thumbnail"
  )
  const personImageUrl = post.image_url ?? wikiThumb

  const svgString =
    post.format === "concepts"
      ? (cd.visual_svg ?? null)
      : post.format === "facts"
      ? (fd.visual_svg ?? null)
      : null
  const cardSvg = svgString && svgString.length < 800 ? svgString : null

  useEffect(() => {
    apiFetch(`/api/posts/${post.id}/likes`)
      .then((r) => r.json())
      .then((d) => {
        if (!likeInteractedRef.current) {
          const liked = isPostLiked(post.id)
          const sent = isLikeSent(post.id)
          const onServer = sent && !hasPendingLike(post.id)
          const adjust = (liked && !onServer ? 1 : 0) - (!liked && sent ? 1 : 0)
          const display = d.count + adjust
          setLikesCount(display)
          setCachedLikeCount(post.id, display)
        }
      })
      .catch(() => {})
    apiFetch(`/api/posts/${post.id}/comments?count=true`)
      .then((r) => r.json())
      .then((d) => setCommentsCount(d.count))
      .catch(() => {})
  }, [post.id])

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true)
      return
    }

    const el = cardRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          viewStartRef.current = Date.now()
          setVisible(true)
          setLiked(isPostLiked(post.id))
          const cached = getCachedLikeCount(post.id)
          if (cached !== null) setLikesCount(cached)
        } else {
          if (viewStartRef.current !== null) {
            const duration_ms = Date.now() - viewStartRef.current
            if (duration_ms >= MIN_DWELL_MS) {
              queueEvent({ post_id: post.id, event_type: "view", duration_ms })
            }
            viewStartRef.current = null
          }
          setVisible(false)
        }
      },
      { threshold: 0.6 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [post.id])

  function handleLike() {
    if (isPostLiked(post.id)) return
    likeInteractedRef.current = true
    likePost(post.id)
    setLiked(true)
    setLikesCount((prev) => { const n = prev + 1; setCachedLikeCount(post.id, n); return n })
    setAnimatingLike(true)
    if (!isLikeSent(post.id)) {
      markLikeSent(post.id)
      queueEvent({ post_id: post.id, event_type: "like" })
    }
    setShowHeartAnim(true)
  }

  function handleUnlike() {
    if (!isPostLiked(post.id)) return
    likeInteractedRef.current = true
    unlikePost(post.id)
    setLiked(false)
    setLikesCount((prev) => { const n = prev - 1; setCachedLikeCount(post.id, n); return n })
    if (hasPendingLike(post.id)) {
      cancelPendingLike(post.id)
      unmarkLikeSent(post.id)
    }
  }

  function handleToggleLike() {
    if (liked) handleUnlike()
    else handleLike()
  }

  function handleSaveClick(e: React.MouseEvent) {
    e.stopPropagation()
    const next = !saved
    setSaved(next)
    if (next) {
      savePost(post.id)
      setAnimatingSave(true)
      setSaveCount((prev) => prev + 1)
    } else {
      unsavePost(post.id)
      setSaveCount((prev) => prev - 1)
    }
  }

  function navigate() {
    const container = cardRef.current?.parentElement
    if (container) {
      sessionStorage.setItem(
        "feedScrollPosition",
        JSON.stringify({ scrollTop: container.scrollTop, tabId: activeTabId })
      )
    }
    sessionStorage.setItem("feedActiveTab", activeTabId)
    router.push(`/post/${post.id}`)
  }

  function handleCardClick() {
    const now = Date.now()
    const elapsed = now - lastTapRef.current
    lastTapRef.current = now

    if (elapsed < 300) {
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current)
        navTimerRef.current = null
      }
      if (!liked) handleLike()
      return
    }

    navTimerRef.current = setTimeout(() => {
      navTimerRef.current = null
      navigate()
    }, 300)
  }

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation()
    const url = window.location.origin + "/post/" + post.id
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.hook ?? "", url })
      } else {
        await navigator.clipboard.writeText(url)
        setToastVisible(true)
        setTimeout(() => setToastVisible(false), 2000)
      }
    } catch {
      // User cancelled share or clipboard failed
    }
  }

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
      className={`h-[100dvh] relative shrink-0 snap-start [scroll-snap-stop:always] flex flex-col bg-zinc-950 bg-gradient-to-b ${style.glow} via-zinc-950 to-zinc-950 pl-5 pr-5 pt-12 pb-8`}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 45%, ${style.radial} 0%, transparent 70%)`,
        }}
      />

      {/* Double-tap heart overlay */}
      {showHeartAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <style>{`@keyframes heartBoom{0%{transform:scale(0);opacity:1}50%{transform:scale(1.3);opacity:1}100%{transform:scale(1);opacity:0}}`}</style>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-24 h-24 text-rose-400"
            style={{ animation: "heartBoom 600ms ease-out forwards" }}
            onAnimationEnd={() => setShowHeartAnim(false)}
          >
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.218l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
          </svg>
        </div>
      )}

      {/* Format indicator row */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
          <span className={`text-xs font-semibold tracking-widest ${style.text}`}>
            {style.label}
          </span>
        </div>
        <span className="text-zinc-500 text-xs">{readTime(post)}</span>
      </div>

      {/* Card body — centered vertically */}
      <div className="flex-1 flex flex-col justify-center relative z-10">
        <div
          className={`transition-all duration-500 ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
        >
          <div className="bg-zinc-900/50 rounded-2xl px-5 py-6 flex flex-col gap-3">

            {/* facts: big stat above title */}
            {post.format === "facts" && fd.stat && (
              <p className={`text-4xl font-black leading-none ${style.text}`}>{fd.stat}</p>
            )}

            {/* Full-width image for non-books, non-people formats */}
            {post.image_url && post.format !== "books" && post.format !== "people" && (
              <div
                className="w-full rounded-lg overflow-hidden"
                style={{ maxHeight: 160, background: `${style.accent}26` }}
              >
                <img
                  src={post.image_url}
                  alt=""
                  loading="lazy"
                  className="w-full object-cover"
                  style={{ maxHeight: 160 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                />
              </div>
            )}

            {/* people: portrait circle + title side by side */}
            {post.format === "people" ? (
              <div className="flex items-center gap-3">
                {personImageUrl && (
                  <div
                    className="shrink-0 rounded-full overflow-hidden"
                    style={{ width: 64, height: 64, background: `${style.accent}26` }}
                  >
                    <img
                      src={personImageUrl}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-4xl font-bold tracking-tight text-white leading-[1.1]">
                    {post.title}
                  </h2>
                </div>
              </div>
            ) : post.format === "books" ? (
              /* books: title + float-right cover */
              <div className="flex gap-3 items-start">
                <h2 className="flex-1 text-3xl font-bold tracking-tight text-white leading-[1.1]">
                  {post.title}
                </h2>
                {post.image_url && (
                  <div
                    className="shrink-0 rounded-lg overflow-hidden"
                    style={{ maxWidth: 120, background: `${style.accent}26` }}
                  >
                    <img
                      src={post.image_url}
                      alt=""
                      loading="lazy"
                      className="object-cover"
                      style={{ maxWidth: 120 }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* All other formats: plain title */
              <h2 className="text-4xl font-bold tracking-tight text-white leading-[1.1]">
                {post.format === "questions" && qd.the_question
                  ? qd.the_question
                  : post.title}
              </h2>
            )}

            {/* people: lifespan + known_for below title */}
            {post.format === "people" && (pd.lifespan || pd.known_for) && (
              <p className="text-zinc-400 text-sm">
                {[pd.lifespan, pd.known_for].filter(Boolean).join(" · ")}
              </p>
            )}

            {/* books: author below title */}
            {post.format === "books" && bd.author && (
              <p className="text-zinc-400 text-sm">{bd.author}</p>
            )}

            {/* Hook line — skipped for questions since the_question is the hook */}
            {post.format !== "questions" && (
              <p className="text-zinc-300 text-base leading-relaxed">{hookText(post)}</p>
            )}

            {/* Inline SVG for concepts and facts (only if short enough for card) */}
            {cardSvg && (
              post.is_user_content
                ? (
                  <img
                    src={`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(cardSvg)))}`}
                    alt=""
                    className="w-full"
                    style={{ maxHeight: 180 }}
                  />
                ) : (
                  /* seed/official SVG — controlled content, dangerouslySetInnerHTML intentional */
                  <div
                    style={{ color: "#e4e4e7", width: "100%", maxHeight: 180, overflow: "hidden" }}
                    dangerouslySetInnerHTML={{ __html: cardSvg }}
                  />
                )
            )}
          </div>
        </div>
      </div>

      {/* Interest tags — absolute, bottom aligned with Share icon, right stops before button column */}
      <div className="absolute top-[calc(100%-88px)] left-5 right-10 flex flex-wrap gap-2 z-10">
        {post.interests.map((name) => (
          <span
            key={name}
            className="bg-zinc-800/80 text-zinc-400 text-xs px-2.5 py-1 rounded-full"
          >
            {name}
          </span>
        ))}
      </div>

      {/* Action buttons — bottom-right column, above BottomNav */}
      <div className="absolute bottom-10 right-3 z-10 flex flex-col items-center gap-1">
        {/* Like */}
        <div className="flex flex-col items-center" style={{ height: "48px" }}>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleLike() }}
            aria-label={liked ? "Unlike" : "Like"}
          >
            <svg
              viewBox="0 0 24 24"
              fill={liked ? "rgb(244,63,94)" : "none"}
              stroke={liked ? "none" : "currentColor"}
              strokeWidth={liked ? 0 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-6 h-6 text-zinc-400 ${animatingLike ? "heart-pop" : ""}`}
              onAnimationEnd={() => setAnimatingLike(false)}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <span className="text-xs text-zinc-300 leading-none mt-1">{likesCount}</span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center" style={{ height: "48px" }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowComments(true) }}
            aria-label="Comments"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-zinc-400"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <span className="text-xs text-zinc-300 leading-none mt-1">{commentsCount}</span>
        </div>

        {/* Save */}
        <div className="flex flex-col items-center" style={{ height: "48px" }}>
          <button
            onClick={handleSaveClick}
            aria-label={saved ? "Unsave" : "Save"}
          >
            <svg
              viewBox="0 0 24 24"
              fill={saved ? "rgb(251,191,36)" : "none"}
              stroke={saved ? "none" : "currentColor"}
              strokeWidth={saved ? 0 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-6 h-6 text-zinc-400 ${animatingSave ? "heart-pop" : ""}`}
              onAnimationEnd={() => setAnimatingSave(false)}
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <span className="text-xs text-zinc-300 leading-none mt-1">{saveCount}</span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center" style={{ height: "48px" }}>
          <button
            onClick={handleShare}
            aria-label="Share"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-zinc-400"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
          <span className="text-xs opacity-0 select-none mt-1">0</span>
        </div>
      </div>

      {/* Comments bottom sheet */}
      {showComments && (
        <CommentsBottomSheet postId={post.id} onClose={() => setShowComments(false)} />
      )}

      {/* Toast for clipboard fallback */}
      <Toast message="Link copied!" visible={toastVisible} />
    </div>
  )
}
