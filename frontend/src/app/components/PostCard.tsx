"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import LikeButton from "./LikeButton"
import { queueEvent } from "@/app/lib/eventQueue"
import { useWikipediaImage } from "@/app/lib/useWikipediaImage"

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
  const cardRef      = useRef<HTMLDivElement>(null)
  const viewStartRef = useRef<number | null>(null)
  const [visible, setVisible] = useState(false)
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

  return (
    <div
      ref={cardRef}
      onClick={() => {
        const container = cardRef.current?.parentElement
        if (container) {
          sessionStorage.setItem(
            "feedScrollPosition",
            JSON.stringify({ scrollTop: container.scrollTop, tabId: activeTabId })
          )
        }
        sessionStorage.setItem("feedActiveTab", activeTabId)
        router.push(`/post/${post.id}`)
      }}
      style={{ cursor: "pointer" }}
      className={`h-[100dvh] relative shrink-0 snap-start [scroll-snap-stop:always] flex flex-col bg-zinc-950 bg-gradient-to-b ${style.glow} via-zinc-950 to-zinc-950 px-5 pt-12 pb-8`}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 45%, ${style.radial} 0%, transparent 70%)`,
        }}
      />

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
              <div
                style={{ color: "#e4e4e7", width: "100%", maxHeight: 180, overflow: "hidden" }}
                dangerouslySetInnerHTML={{ __html: cardSvg }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Interest tags */}
      <div className="flex flex-wrap gap-2 relative z-10">
        {post.interests.map((name) => (
          <span
            key={name}
            className="bg-zinc-800/80 text-zinc-400 text-xs px-2.5 py-1 rounded-full"
          >
            {name}
          </span>
        ))}
      </div>

      {/* Like button */}
      <div className="absolute bottom-[88px] right-5 z-10">
        <LikeButton postId={post.id} />
      </div>
    </div>
  )
}
