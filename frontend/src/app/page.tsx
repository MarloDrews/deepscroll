"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import PostCard from "@/app/components/PostCard"
import BottomNav from "@/app/components/BottomNav"
import FeedHeader, { headerConfigFor, type FeedTab } from "@/app/components/FeedHeader"
import EmptyState from "@/components/EmptyState"
import Spinner from "@/components/Spinner"
import type { Post } from "@/types/post"
import { FORMAT_IDS, FORMAT_STYLES } from "@/lib/formats"
import { designForTab } from "@/lib/redesign"
import { designModule } from "@/app/components/redesign/registry"
import { useAuth } from "@/app/lib/auth"
import { useBodyDesign } from "@/app/lib/useBodyDesign"

const TABS: FeedTab[] = [
  // Non-format tabs use the primary ink color (--color-ink).
  { id: "for-you", label: "For You", format: null, accent: "#eceeff", rgb: [236, 238, 255] },
  { id: "following", label: "Following", format: null, accent: "#eceeff", rgb: [236, 238, 255] },
  ...FORMAT_IDS.map((id) => ({
    id,
    label: FORMAT_STYLES[id].label,
    format: id,
    accent: FORMAT_STYLES[id].accent,
    rgb: FORMAT_STYLES[id].rgb,
  })),
]

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100dvh] bg-surface-0 flex justify-center">
      <div className="w-full max-w-[430px] h-[100dvh] relative">{children}</div>
    </div>
  )
}

function TabPage({
  tab,
  slugs,
  isActivated,
}: {
  tab: (typeof TABS)[number]
  slugs: string[]
  isActivated: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { user, loading: authLoading } = useAuth()
  const isFollowingTab = tab.id === "following"
  // Design is static per tab, so cards and states never lag mid-swipe.
  const design = designForTab(tab.id)
  const dmod = designModule(design)

  // SWR key; null reproduces the old fetch gating (not activated yet, no
  // interests, or following tab before auth resolves). revalidateIfStale:
  // false serves a revisited tab from cache with no background refetch —
  // feed order is jittered per request server-side, so a silent revalidate
  // would visibly reshuffle posts under the user.
  let key: string | null = null
  if (isActivated) {
    if (isFollowingTab) {
      if (!authLoading && user) key = "/api/feed/following"
    } else if (slugs.length > 0) {
      const params = new URLSearchParams({ interests: slugs.join(",") })
      if (tab.format) params.set("format", tab.format)
      key = `/api/feed?${params}`
    }
  }
  const { data, error } = useSWR<Post[]>(key, { revalidateIfStale: false })
  // Error mapping preserves the old per-tab behavior: the following tab
  // treated failures as an empty feed, the others kept showing the spinner.
  const posts: Post[] | null = isFollowingTab ? (error ? [] : data ?? null) : data ?? null

  useEffect(() => {
    if (posts === null || !scrollRef.current) return
    const raw = sessionStorage.getItem("feedScrollPosition")
    if (!raw) return
    const { scrollTop, tabId } = JSON.parse(raw)
    if (tabId !== tab.id) return
    scrollRef.current.scrollTop = scrollTop
    sessionStorage.removeItem("feedScrollPosition")
  }, [posts, tab.id])

  return (
    <div
      ref={scrollRef}
      data-design={design ?? undefined}
      className={`w-full shrink-0 snap-start h-[100dvh] overflow-y-scroll snap-y snap-mandatory overscroll-y-contain [&::-webkit-scrollbar]:hidden [scrollbar-width:none] ${dmod?.tabPagePaddingClass ?? "pb-14"}`}
    >
      {!isActivated ? (
        <div className="h-full bg-surface-0" />
      ) : isFollowingTab && !authLoading && !user ? (
        <div className="h-full flex flex-col items-center justify-center gap-3 bg-surface-0 px-8 text-center">
          <p className="text-ink font-serif font-medium text-lg">See posts from people you follow</p>
          <Link href="/login" className="btn btn-primary px-5 py-2">
            Log in
          </Link>
        </div>
      ) : isFollowingTab && posts !== null && posts.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center gap-3 bg-surface-0 px-8 text-center">
          <p className="text-ink font-serif font-medium text-lg">Nothing here yet</p>
          <p className="text-ink-muted text-sm">Posts from people you follow will show up here.</p>
          <Link href="/search" className="btn btn-primary px-5 py-2">
            Find people
          </Link>
        </div>
      ) : posts === null ? (
        dmod?.FeedLoading ? (
          <dmod.FeedLoading tab={tab} />
        ) : (
          <div className="h-full flex items-center justify-center bg-surface-0">
            <Spinner />
          </div>
        )
      ) : posts.length === 0 && tab.format ? (
        dmod?.FeedEmpty ? (
          <dmod.FeedEmpty tab={tab} />
        ) : (
          <div className="h-full flex items-center justify-center bg-surface-0">
            <EmptyState format={tab.format} accentColor={tab.accent} />
          </div>
        )
      ) : posts.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center gap-3 bg-surface-0">
          <p className="text-ink font-serif font-medium text-lg">Nothing here yet</p>
          <p className="text-ink-muted text-sm">Try adjusting your interests</p>
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} activeTabId={tab.id} />)
      )}
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("for-you")
  // Chrome (header, nav, body texture) follows the settled tab's design.
  const activeDesign = designForTab(activeTab)
  useBodyDesign(activeDesign)
  const [activatedTabs, setActivatedTabs] = useState<Set<string>>(new Set(["for-you"]))
  const [slugs, setSlugs] = useState<string[]>([])
  const outerRef        = useRef<HTMLDivElement>(null)
  const activeTabRef    = useRef("for-you")
  const tabRefs         = useRef<Record<string, HTMLButtonElement | null>>({})
  const indicatorRef    = useRef<HTMLDivElement>(null)
  const tabStripRef     = useRef<HTMLDivElement>(null)
  const isFirstTabCenter = useRef(true)

  // Check localStorage on mount, store interests, and restore active tab from sessionStorage
  useEffect(() => {
    const saved = localStorage.getItem("deepscroll_interests")
    if (!saved) {
      router.replace("/onboarding")
      return
    }
    setSlugs(JSON.parse(saved))

    const savedTab = sessionStorage.getItem("feedActiveTab")
    if (savedTab) {
      const tabIndex = TABS.findIndex((t) => t.id === savedTab)
      if (tabIndex !== -1) {
        activeTabRef.current = savedTab
        setActiveTab(savedTab)
        setActivatedTabs(new Set(["for-you", savedTab]))
        sessionStorage.removeItem("feedActiveTab")
        requestAnimationFrame(() => {
          if (outerRef.current) {
            outerRef.current.scrollLeft = tabIndex * outerRef.current.clientWidth
          }
        })
      }
    }
  }, [router])

  // Align the active tab: first tab snaps left, last tab snaps right, middle tabs center.
  useEffect(() => {
    const button = tabRefs.current[activeTab]
    if (!button) return
    const strip = tabStripRef.current
    const tabIndex = TABS.findIndex((t) => t.id === activeTab)
    const behavior: ScrollBehavior = isFirstTabCenter.current ? "instant" : "smooth"
    isFirstTabCenter.current = false

    if (tabIndex === 0) {
      strip?.scrollTo({ left: 0, behavior })
    } else if (tabIndex === TABS.length - 1) {
      strip?.scrollTo({ left: strip.scrollWidth, behavior })
    } else {
      button.scrollIntoView({ behavior, inline: "center", block: "nearest" })
    }
  }, [activeTab])

  // Real-time indicator + state update on outer feed scroll
  useEffect(() => {
    const el = outerRef.current
    if (!el) return

    function updateIndicator() {
      if (!el || !indicatorRef.current) return
      const progress   = el.scrollLeft / el.clientWidth
      const leftIndex  = Math.max(0,              Math.floor(progress))
      const rightIndex = Math.min(TABS.length - 1, Math.ceil(progress))
      const fraction   = progress - Math.floor(progress)

      const leftBtn  = tabRefs.current[TABS[leftIndex].id]
      const rightBtn = tabRefs.current[TABS[rightIndex].id]
      if (!leftBtn || !rightBtn) return

      // Per-design indicator behavior, read for both sides of the swipe.
      const leftCfg  = headerConfigFor(designForTab(TABS[leftIndex].id))
      const rightCfg = headerConfigFor(designForTab(TABS[rightIndex].id))

      // Width: pill/block indicators track the tab button width; otherwise
      // clear any stale inline width and read the CSS size live.
      let width: number
      if (leftCfg.trackIndicatorWidth || rightCfg.trackIndicatorWidth) {
        width = leftBtn.offsetWidth + (rightBtn.offsetWidth - leftBtn.offsetWidth) * fraction
        indicatorRef.current.style.width = `${width}px`
      } else {
        indicatorRef.current.style.width = ""
        width = indicatorRef.current.offsetWidth
      }
      const halfInd = width / 2
      const leftX  = leftBtn.offsetLeft  + leftBtn.offsetWidth  / 2 - halfInd
      const rightX = rightBtn.offsetLeft + rightBtn.offsetWidth / 2 - halfInd
      const x      = leftX + (rightX - leftX) * fraction

      indicatorRef.current.style.transition = "none"
      indicatorRef.current.style.left = `${x}px`

      // Color: fixed-color designs keep the class color; clearing the inline
      // value also drops a stale interpolated color after a design switch.
      if (leftCfg.lockIndicatorColor || rightCfg.lockIndicatorColor) {
        indicatorRef.current.style.backgroundColor = ""
      } else {
        const [lr, lg, lb] = TABS[leftIndex].rgb as [number, number, number]
        const [rr, rg, rb] = TABS[rightIndex].rgb as [number, number, number]
        const r = Math.round(lr + (rr - lr) * fraction)
        const g = Math.round(lg + (rg - lg) * fraction)
        const b = Math.round(lb + (rb - lb) * fraction)
        indicatorRef.current.style.backgroundColor = `rgb(${r},${g},${b})`
      }
    }

    function onSettled() {
      if (!el) return
      // Restore a brief transition so the final snap feels smooth
      if (indicatorRef.current) {
        indicatorRef.current.style.transition =
          "left 0.15s ease-out, background-color 0.15s ease-out"
      }
      const index = Math.round(el.scrollLeft / el.clientWidth)
      const tab = TABS[index]
      if (!tab || tab.id === activeTabRef.current) return
      activeTabRef.current = tab.id
      setActiveTab(tab.id)
      setActivatedTabs((prev) => new Set([...prev, tab.id]))
    }

    // Set initial indicator position
    updateIndicator()

    el.addEventListener("scroll", updateIndicator, { passive: true })

    if ("onscrollend" in el) {
      el.addEventListener("scrollend", onSettled, { passive: true })
      return () => {
        el.removeEventListener("scroll", updateIndicator)
        el.removeEventListener("scrollend", onSettled)
      }
    }

    // Fallback: 50ms debounce for older browsers.
    // Cast needed: lib.dom assumes scrollend always exists, narrowing el to never here.
    const legacyEl = el as HTMLDivElement
    let timer: ReturnType<typeof setTimeout>
    function onScroll() {
      clearTimeout(timer)
      timer = setTimeout(onSettled, 50)
    }
    legacyEl.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      legacyEl.removeEventListener("scroll", updateIndicator)
      legacyEl.removeEventListener("scroll", onScroll)
      clearTimeout(timer)
    }
  }, [])

  function handleTabClick(index: number) {
    const tab = TABS[index]
    activeTabRef.current = tab.id
    setActiveTab(tab.id)
    setActivatedTabs((prev) => new Set([...prev, tab.id]))
    outerRef.current?.scrollTo({
      left: index * (outerRef.current.clientWidth),
      behavior: "smooth",
    })
  }

  return (
    <PhoneFrame>
      <FeedHeader
        tabs={TABS}
        activeTab={activeTab}
        design={activeDesign}
        onTabClick={handleTabClick}
        onSearch={() => router.push("/search")}
        tabRefs={tabRefs}
        indicatorRef={indicatorRef}
        tabStripRef={tabStripRef}
      />

      {/* Horizontal strip — one full-width page per tab */}
      <div
        ref={outerRef}
        className="h-full flex flex-row overflow-x-scroll overflow-y-hidden snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
      >
        {TABS.map((tab) => (
          <TabPage
            key={tab.id}
            tab={tab}
            slugs={slugs}
            isActivated={activatedTabs.has(tab.id)}
          />
        ))}
      </div>
      <BottomNav activeTab="feed" design={activeDesign} />
    </PhoneFrame>
  )
}
