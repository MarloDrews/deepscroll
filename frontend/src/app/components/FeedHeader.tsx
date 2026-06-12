"use client"

import type { MutableRefObject, RefObject } from "react"
import type { FormatId } from "@/lib/formats"

// One feed tab as defined by the TABS array in app/page.tsx.
export interface FeedTab {
  id: string
  label: string
  format: FormatId | null
  accent: string
  rgb: readonly [number, number, number]
}

interface FeedHeaderProps {
  tabs: FeedTab[]
  activeTab: string
  onTabClick: (index: number) => void
  onSearch: () => void
  // Refs stay owned by the feed page: the scroll-sync listeners that position
  // the indicator live there, next to the horizontal pager they read from.
  tabRefs: MutableRefObject<Record<string, HTMLButtonElement | null>>
  indicatorRef: RefObject<HTMLDivElement | null>
  tabStripRef: RefObject<HTMLDivElement | null>
}

// Tab bar — single sliding indicator, TikTok style. Extracted from
// app/page.tsx unchanged; the page keeps the scroll mechanics, this
// component owns the markup.
export default function FeedHeader({
  tabs,
  activeTab,
  onTabClick,
  onSearch,
  tabRefs,
  indicatorRef,
  tabStripRef,
}: FeedHeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-20">
      <div className="relative bg-surface-0/90 backdrop-blur-md">
        {/* Search — top-right, TikTok style */}
        <button
          onClick={onSearch}
          className="absolute right-1 top-0 h-[44px] w-10 flex items-center justify-center text-ink-dim hover:text-ink transition-colors duration-150 cursor-pointer z-20"
          aria-label="Search"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>
        {/* Scrollable tab strip */}
        <div
          ref={tabStripRef}
          className="relative flex overflow-x-scroll snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [scrollbar-width:none] h-[44px] items-center px-[calc(50%-40px)]"
          // Labels fade out at both edges instead of hard-clipping; the wider
          // right ramp keeps them legible until they tuck under the search button.
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0, black 32px, black calc(100% - 88px), transparent calc(100% - 36px))",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0, black 32px, black calc(100% - 88px), transparent calc(100% - 36px))",
          }}
        >
          {tabs.map((tab, i) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el }}
                onClick={() => onTabClick(i)}
                className={`snap-center shrink-0 px-4 h-[44px] flex items-center justify-center cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "text-ink scale-100 font-semibold"
                    : "text-ink-muted scale-90 font-medium"
                }`}
              >
                <span className="text-sm whitespace-nowrap">{tab.label}</span>
              </button>
            )
          })}
          {/* Single sliding indicator — positioned in scroll-content space */}
          <div
            ref={indicatorRef}
            className="absolute bottom-0 h-[4px] w-4 rounded-full pointer-events-none"
            style={{ left: 0, backgroundColor: "rgb(239,233,222)" }}
          />
        </div>
      </div>
    </div>
  )
}
