"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/lib/auth"
import { apiFetch } from "@/app/lib/api"
import { type Post, FORMAT_STYLES } from "@/app/components/PostCard"
import { CATEGORIES } from "@/app/onboarding/InterestPicker"
import BottomNav from "@/app/components/BottomNav"

const API_URL = process.env.NEXT_PUBLIC_API_URL

const FORMATS = [
  { id: "books",     emoji: "📖", name: "Books",     accent: "border-amber-400",   description: "Summarize a book's key ideas"   },
  { id: "facts",     emoji: "⚡", name: "Facts",     accent: "border-cyan-400",    description: "Share a mind-blowing fact"       },
  { id: "people",    emoji: "👤", name: "People",    accent: "border-rose-400",    description: "Profile an inspiring person"     },
  { id: "concepts",  emoji: "🧠", name: "Concepts",  accent: "border-violet-400",  description: "Explain a mental model"          },
  { id: "questions", emoji: "❓", name: "Questions", accent: "border-emerald-400", description: "Pose a thought experiment"       },
  { id: "stories",   emoji: "📜", name: "Stories",   accent: "border-orange-400",  description: "Tell a gripping true story"      },
] as const

type FormatId = (typeof FORMATS)[number]["id"]

interface Interest {
  id: number
  name: string
  slug: string
}

const inputCls =
  "w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600"
const sectionCls = "text-zinc-400 text-xs uppercase tracking-wider mb-2 mt-5"

function FieldError({ msg }: { msg: string | undefined }) {
  if (!msg) return null
  return <p className="text-red-400 text-xs mt-1">{msg}</p>
}

export default function CreatePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [step, setStep] = useState<1 | 2 | 3 | "success">(1)
  const [selectedFormat, setSelectedFormat] = useState<FormatId | null>(null)

  // Step 2 — duplicate check
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Post[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  // Step 3 — form fields
  const [form, setForm] = useState({
    title: "", hook: "", takeaway: "", source: "", source_url: "",
    author: "", isbn: "", publication_year: "",
    stat: "",
    lifespan: "", known_for: "", field: "",
    definition: "", concrete_example: "",
    the_question: "", framing: "",
    setting: "", the_twist: "",
  })
  const [keyPoints, setKeyPoints] = useState(["", ""])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [allInterests, setAllInterests] = useState<Interest[]>([])
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [svgContent, setSvgContent] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [svgUploading, setSvgUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState("")

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch interests for the tag picker
  useEffect(() => {
    apiFetch("/api/interests")
      .then((r) => r.json())
      .then((data: Interest[]) => setAllInterests(data))
      .catch(() => {})
  }, [])

  // Debounced search in step 2
  useEffect(() => {
    if (step !== 2) return
    const trimmed = searchQuery.trim()
    if (!trimmed) { setSearchResults([]); return }
    setSearchLoading(true)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmed })
        if (selectedFormat) params.set("format", selectedFormat)
        const res = await apiFetch(`/api/search?${params}`)
        const data: Post[] = await res.json()
        setSearchResults(data.slice(0, 5))
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [searchQuery, step, selectedFormat])

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next })
  }

  function addKeyPoint() {
    if (keyPoints.length < 6) setKeyPoints((prev) => [...prev, ""])
  }

  function removeKeyPoint(i: number) {
    setKeyPoints((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateKeyPoint(i: number, val: string) {
    setKeyPoints((prev) => prev.map((p, idx) => idx === i ? val : p))
    setErrors((prev) => { const next = { ...prev }; delete next.keyPoints; return next })
  }

  function toggleInterest(slug: string) {
    setSelectedInterests((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug)
      if (prev.length >= 10) return prev
      return [...prev, slug]
    })
    setErrors((prev) => { const next = { ...prev }; delete next.interests; return next })
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await apiFetch("/api/upload/image", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? "Upload failed")
      setImageUrl(data.url)
    } catch (err) {
      setErrors((prev) => ({ ...prev, image: err instanceof Error ? err.message : "Upload failed" }))
    } finally {
      setImageUploading(false)
      e.target.value = ""
    }
  }

  async function handleSvgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSvgUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await apiFetch("/api/upload/svg", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? "Upload failed")
      setSvgContent(data.svg_content)
    } catch (err) {
      setErrors((prev) => ({ ...prev, svg: err instanceof Error ? err.message : "Upload failed" }))
    } finally {
      setSvgUploading(false)
      e.target.value = ""
    }
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = "Required"
    if (!form.hook.trim()) errs.hook = "Required"
    if (keyPoints.filter((p) => p.trim()).length < 1) errs.keyPoints = "Add at least one point"
    if (form.source_url && !form.source_url.match(/^https?:\/\//)) errs.source_url = "Must start with http:// or https://"
    if (selectedFormat === "books" && !form.author.trim()) errs.author = "Required"
    if (selectedFormat === "facts" && !form.stat.trim()) errs.stat = "Required"
    if (selectedFormat === "people" && !form.known_for.trim()) errs.known_for = "Required"
    if (selectedFormat === "people" && !form.field.trim()) errs.field = "Required"
    if (selectedFormat === "concepts" && !form.definition.trim()) errs.definition = "Required"
    if (selectedFormat === "questions" && !form.the_question.trim()) errs.the_question = "Required"
    if (selectedFormat === "stories" && !form.setting.trim()) errs.setting = "Required"
    if (selectedInterests.length === 0) errs.interests = "Select at least 1 interest"
    return errs
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubmitting(true)
    setServerError("")
    try {
      const details: Record<string, unknown> = {}
      if (selectedFormat === "books") {
        details.author = form.author
        if (form.isbn) details.isbn = form.isbn
        if (form.publication_year) details.publication_year = form.publication_year
      } else if (selectedFormat === "facts") {
        details.stat = form.stat
      } else if (selectedFormat === "people") {
        if (form.lifespan) details.lifespan = form.lifespan
        details.known_for = form.known_for
        details.field = form.field
      } else if (selectedFormat === "concepts") {
        details.definition = form.definition
        if (form.concrete_example) details.concrete_example = form.concrete_example
      } else if (selectedFormat === "questions") {
        details.the_question = form.the_question
        if (form.framing) details.framing = form.framing
      } else if (selectedFormat === "stories") {
        details.setting = form.setting
        if (form.the_twist) details.the_twist = form.the_twist
      }
      if (svgContent) details.visual_svg = svgContent

      const payload = {
        format: selectedFormat,
        title: form.title.trim(),
        hook: form.hook.trim(),
        key_points: keyPoints.filter((p) => p.trim()),
        takeaway: form.takeaway.trim() || null,
        source: form.source.trim() || null,
        source_url: form.source_url.trim() || null,
        image_url: imageUrl || null,
        details: Object.keys(details).length > 0 ? details : null,
        interests: selectedInterests,
      }

      const res = await apiFetch("/api/posts", { method: "POST", body: JSON.stringify(payload) })
      if (res.status === 201) {
        setStep("success")
      } else {
        const data = await res.json()
        setServerError(data.detail ?? "Something went wrong. Please try again.")
      }
    } catch {
      setServerError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setStep(1)
    setSelectedFormat(null)
    setSearchQuery("")
    setSearchResults([])
    setForm({ title: "", hook: "", takeaway: "", source: "", source_url: "", author: "", isbn: "", publication_year: "", stat: "", lifespan: "", known_for: "", field: "", definition: "", concrete_example: "", the_question: "", framing: "", setting: "", the_twist: "" })
    setKeyPoints(["", ""])
    setSelectedInterests([])
    setImageUrl(null)
    setSvgContent(null)
    setErrors({})
    setServerError("")
  }

  // Build interest sections from CATEGORIES
  const bySlug = new Map(allInterests.map((i) => [i.slug, i]))
  const interestSections = CATEGORIES.map((cat) => ({
    label: cat.label,
    items: cat.slugs.flatMap((s) => { const i = bySlug.get(s); return i ? [i] : [] }),
  })).filter((sec) => sec.items.length > 0)

  const formatStyle = selectedFormat ? FORMAT_STYLES[selectedFormat] : null

  // Not logged in
  if (!loading && !user) {
    return (
      <div className="h-[100dvh] bg-zinc-950 flex justify-center">
        <div className="w-full max-w-[430px] h-[100dvh] relative flex flex-col items-center justify-center px-8 text-center gap-4">
          <p className="text-white text-lg font-semibold">Sign in to create a post</p>
          <button onClick={() => router.push("/login")} className="bg-white text-zinc-950 font-semibold rounded-full px-8 py-3 text-sm">
            Sign in
          </button>
        </div>
      </div>
    )
  }

  if (loading) return null

  // Success screen
  if (step === "success") {
    return (
      <div className="h-[100dvh] bg-zinc-950 flex justify-center">
        <div className="w-full max-w-[430px] h-[100dvh] relative flex flex-col items-center justify-center px-8 text-center gap-4">
          <p className="text-white text-2xl font-bold">Your post is pending review</p>
          <p className="text-zinc-400 text-sm">It will appear in the feed once approved.</p>
          <div className="flex flex-col gap-3 w-full mt-4">
            <button onClick={resetForm} className="bg-white text-zinc-950 font-semibold rounded-full h-12 w-full text-sm">
              Create another
            </button>
            <button onClick={() => router.push("/my-posts")} className="border border-zinc-700 text-white rounded-full h-12 w-full text-sm">
              View my posts
            </button>
          </div>
        </div>
      </div>
    )
  }

  const stepNum = step as number

  return (
    <div className="h-[100dvh] bg-zinc-950 flex justify-center">
      <div className="w-full max-w-[430px] h-[100dvh] relative">
        <div className="h-full overflow-y-auto pb-24 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] px-4 pt-6">

          {/* Step indicator */}
          <p className="text-zinc-500 text-xs text-center mb-3">Step {stepNum} of 3</p>
          <div className="h-0.5 bg-zinc-800 rounded-full mb-6">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${(stepNum / 3) * 100}%` }}
            />
          </div>

          {/* Back button (steps 2 and 3) */}
          {step > 1 && (
            <button
              onClick={() => setStep((prev) => (prev as number) - 1 as 1 | 2 | 3)}
              className="flex items-center gap-1 text-zinc-400 text-sm mb-4"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back
            </button>
          )}

          {/* ───────── STEP 1: Format selection ───────── */}
          {step === 1 && (
            <>
              <h1 className="text-white text-xl font-bold mb-1">Choose a format</h1>
              <p className="text-zinc-400 text-sm mb-5">What kind of post are you creating?</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {FORMATS.map((fmt) => {
                  const selected = selectedFormat === fmt.id
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => setSelectedFormat(fmt.id)}
                      className={`rounded-2xl p-5 text-left transition-colors ${
                        selected
                          ? `border-2 ${fmt.accent} bg-zinc-900`
                          : "border border-zinc-800 bg-zinc-900/50"
                      }`}
                    >
                      <div className="text-3xl mb-2">{fmt.emoji}</div>
                      <div className="font-semibold text-white text-sm">{fmt.name}</div>
                      <div className="text-zinc-400 text-xs mt-0.5">{fmt.description}</div>
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => { if (selectedFormat) setStep(2) }}
                disabled={!selectedFormat}
                className="bg-white text-zinc-950 font-semibold rounded-full h-12 w-full text-sm disabled:opacity-30 transition-opacity"
              >
                Next →
              </button>
            </>
          )}

          {/* ───────── STEP 2: Duplicate check ───────── */}
          {step === 2 && (
            <>
              <h1 className="text-white text-xl font-bold mb-1">Does this already exist?</h1>
              <p className="text-zinc-400 text-sm mb-5">Search to avoid duplicates — like Wikipedia</p>
              <div className="relative mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search existing posts..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600"
                />
              </div>

              {searchLoading && (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className="flex flex-col gap-2 mb-4">
                  {searchResults.map((post) => {
                    const style = FORMAT_STYLES[post.format as keyof typeof FORMAT_STYLES]
                    const snippet = (post.hook ?? post.body ?? "").slice(0, 100)
                    return (
                      <button
                        key={post.id}
                        onClick={() => window.open(`/post/${post.id}`, "_blank")}
                        className="w-full text-left bg-zinc-900/60 rounded-2xl px-4 py-3"
                      >
                        {style && <span className={`text-xs font-medium ${style.text}`}>{style.label}</span>}
                        <p className="text-white font-semibold text-sm mt-0.5 line-clamp-2">{post.title}</p>
                        {snippet && <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{snippet}</p>}
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="flex flex-col gap-3 mt-4">
                <button
                  onClick={() => setStep(3)}
                  className="bg-white text-zinc-950 font-semibold rounded-full h-12 w-full text-sm"
                >
                  Continue anyway
                </button>
              </div>
            </>
          )}

          {/* ───────── STEP 3: Structured form ───────── */}
          {step === 3 && (
            <>
              <h1 className="text-white text-xl font-bold mb-5">
                {FORMATS.find((f) => f.id === selectedFormat)?.emoji}{" "}
                {FORMATS.find((f) => f.id === selectedFormat)?.name}
              </h1>

              {/* Title */}
              <p className={sectionCls}>Title *</p>
              <div>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  maxLength={200}
                  placeholder="Title of your post..."
                  className={inputCls}
                />
                <div className="flex justify-between mt-1">
                  <FieldError msg={errors.title} />
                  <span className="text-zinc-600 text-xs ml-auto">{form.title.length}/200</span>
                </div>
              </div>

              {/* Hook */}
              <p className={sectionCls}>Hook *</p>
              <textarea
                value={form.hook}
                onChange={(e) => { setField("hook", e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px" }}
                maxLength={500}
                rows={2}
                placeholder="One compelling opening sentence..."
                className={`${inputCls} resize-none overflow-hidden`}
              />
              <FieldError msg={errors.hook} />

              {/* Key Points */}
              <p className={sectionCls}>Key Points *</p>
              <div className="flex flex-col gap-2">
                {keyPoints.map((pt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={pt}
                      onChange={(e) => updateKeyPoint(i, e.target.value)}
                      maxLength={300}
                      placeholder={`Point ${i + 1}`}
                      className={`${inputCls} flex-1`}
                    />
                    {keyPoints.length > 2 && (
                      <button
                        onClick={() => removeKeyPoint(i)}
                        className="text-zinc-500 hover:text-white w-8 h-8 flex items-center justify-center shrink-0 text-lg"
                        aria-label="Remove point"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {keyPoints.length < 6 && (
                  <button onClick={addKeyPoint} className="text-zinc-400 text-sm text-left py-1">
                    + Add point
                  </button>
                )}
              </div>
              <FieldError msg={errors.keyPoints} />

              {/* Format-specific fields */}
              {selectedFormat === "books" && (
                <>
                  <p className={sectionCls}>Author *</p>
                  <input type="text" value={form.author} onChange={(e) => setField("author", e.target.value)} placeholder="Author name" className={inputCls} />
                  <FieldError msg={errors.author} />
                  <p className={sectionCls}>ISBN</p>
                  <input type="text" value={form.isbn} onChange={(e) => setField("isbn", e.target.value)} placeholder="978-..." className={inputCls} />
                  <p className={sectionCls}>Publication year</p>
                  <input type="text" value={form.publication_year} onChange={(e) => setField("publication_year", e.target.value)} placeholder="e.g. 2018" className={inputCls} />
                </>
              )}

              {selectedFormat === "facts" && (
                <>
                  <p className={sectionCls}>The stat *</p>
                  <input type="text" value={form.stat} onChange={(e) => setField("stat", e.target.value)} maxLength={100} placeholder="e.g. 40% of food is wasted" className={inputCls} />
                  <FieldError msg={errors.stat} />
                </>
              )}

              {selectedFormat === "people" && (
                <>
                  <p className={sectionCls}>Lifespan</p>
                  <input type="text" value={form.lifespan} onChange={(e) => setField("lifespan", e.target.value)} placeholder="e.g. 1815–1852" className={inputCls} />
                  <p className={sectionCls}>Known for *</p>
                  <input type="text" value={form.known_for} onChange={(e) => setField("known_for", e.target.value)} placeholder="e.g. Inventing the first algorithm" className={inputCls} />
                  <FieldError msg={errors.known_for} />
                  <p className={sectionCls}>Field *</p>
                  <input type="text" value={form.field} onChange={(e) => setField("field", e.target.value)} placeholder="e.g. Mathematics, Computing" className={inputCls} />
                  <FieldError msg={errors.field} />
                </>
              )}

              {selectedFormat === "concepts" && (
                <>
                  <p className={sectionCls}>One-line definition *</p>
                  <input type="text" value={form.definition} onChange={(e) => setField("definition", e.target.value)} maxLength={200} placeholder="The clearest possible definition..." className={inputCls} />
                  <FieldError msg={errors.definition} />
                  <p className={sectionCls}>Concrete example</p>
                  <textarea value={form.concrete_example} onChange={(e) => setField("concrete_example", e.target.value)} rows={3} placeholder="A real-world example..." className={`${inputCls} resize-none`} />
                </>
              )}

              {selectedFormat === "questions" && (
                <>
                  <p className={sectionCls}>The question *</p>
                  <textarea value={form.the_question} onChange={(e) => setField("the_question", e.target.value)} maxLength={300} rows={3} placeholder="What is the question you want to pose?" className={`${inputCls} resize-none text-base`} />
                  <FieldError msg={errors.the_question} />
                  <p className={sectionCls}>Framing</p>
                  <textarea value={form.framing} onChange={(e) => setField("framing", e.target.value)} rows={3} placeholder="Context or framing for the question..." className={`${inputCls} resize-none`} />
                </>
              )}

              {selectedFormat === "stories" && (
                <>
                  <p className={sectionCls}>Setting *</p>
                  <input type="text" value={form.setting} onChange={(e) => setField("setting", e.target.value)} maxLength={200} placeholder="When and where, e.g. Berlin, 1989" className={inputCls} />
                  <FieldError msg={errors.setting} />
                  <p className={sectionCls}>The twist</p>
                  <textarea value={form.the_twist} onChange={(e) => setField("the_twist", e.target.value)} rows={3} placeholder="The surprising turn..." className={`${inputCls} resize-none`} />
                </>
              )}

              {/* Takeaway */}
              <p className={sectionCls}>Takeaway</p>
              <textarea
                value={form.takeaway}
                onChange={(e) => setField("takeaway", e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="What should the reader take away?"
                className={`${inputCls} resize-none`}
              />

              {/* Source */}
              <p className={sectionCls}>Source</p>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setField("source", e.target.value)}
                maxLength={300}
                placeholder="Book title, article name, etc."
                className={inputCls}
              />

              {/* Source URL */}
              <p className={sectionCls}>Source URL</p>
              <input
                type="url"
                value={form.source_url}
                onChange={(e) => setField("source_url", e.target.value)}
                placeholder="https://..."
                className={inputCls}
              />
              <FieldError msg={errors.source_url} />

              {/* Image upload */}
              <p className={sectionCls}>Image</p>
              <label className="block border-2 border-dashed border-zinc-700 rounded-xl p-6 text-center cursor-pointer hover:border-zinc-500 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {imageUploading ? (
                  <div className="flex justify-center"><div className="w-5 h-5 border-2 border-zinc-700 border-t-white rounded-full animate-spin" /></div>
                ) : imageUrl ? (
                  <img src={`${API_URL}${imageUrl}`} alt="Preview" className="w-full rounded-lg max-h-48 object-cover" />
                ) : (
                  <span className="text-zinc-500 text-sm">Tap to upload image</span>
                )}
              </label>
              <FieldError msg={errors.image} />

              {/* SVG upload — concepts and facts only */}
              {(selectedFormat === "concepts" || selectedFormat === "facts") && (
                <>
                  <p className={sectionCls}>Diagram (SVG)</p>
                  <label className="block border-2 border-dashed border-zinc-700 rounded-xl p-4 text-center cursor-pointer hover:border-zinc-500 transition-colors">
                    <input
                      type="file"
                      accept="image/svg+xml"
                      className="hidden"
                      onChange={handleSvgUpload}
                    />
                    {svgUploading ? (
                      <div className="flex justify-center"><div className="w-5 h-5 border-2 border-zinc-700 border-t-white rounded-full animate-spin" /></div>
                    ) : svgContent ? (
                      <span className="text-emerald-400 text-sm">Diagram uploaded</span>
                    ) : (
                      <span className="text-zinc-500 text-sm">Upload a diagram (SVG)</span>
                    )}
                  </label>
                  <FieldError msg={errors.svg} />
                </>
              )}

              {/* Interests */}
              <div className="flex items-center justify-between mt-5 mb-2">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Interests *</p>
                <span className="text-zinc-500 text-xs">{selectedInterests.length}/10</span>
              </div>
              <FieldError msg={errors.interests} />
              {interestSections.map((sec) => (
                <div key={sec.label} className="mb-4">
                  <p className="text-zinc-600 text-xs mb-2">{sec.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {sec.items.map((interest) => {
                      const isSelected = selectedInterests.includes(interest.slug)
                      return (
                        <button
                          key={interest.slug}
                          onClick={() => toggleInterest(interest.slug)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            isSelected
                              ? formatStyle
                                ? `text-white`
                                : "bg-zinc-700 text-white"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                          style={isSelected && formatStyle ? { backgroundColor: formatStyle.accent } : undefined}
                        >
                          {interest.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Submit */}
              {serverError && <p className="text-red-400 text-sm mb-3">{serverError}</p>}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-white text-zinc-950 font-semibold rounded-full h-12 w-full text-sm disabled:opacity-50 transition-opacity mt-4"
              >
                {submitting ? "Submitting..." : "Submit post"}
              </button>
            </>
          )}
        </div>

        <BottomNav activeTab="create" />
      </div>
    </div>
  )
}
