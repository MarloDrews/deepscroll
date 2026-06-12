"use client"

import type { MutableRefObject, RefObject } from "react"
import type { FormatId } from "@/lib/formats"
import type { DesignId } from "@/lib/redesign"
import { designModule } from "./redesign/registry"
import type { HeaderConfig } from "./redesign/types"

// One feed tab as defined by the TABS array in app/page.tsx.
export interface FeedTab {
  id: string
  label: string
  format: FormatId | null
  accent: string
  rgb: readonly [number, number, number]
}

// Baseline header look — the pre-exploration markup expressed as a config.
// Design variants supply their own HeaderConfig through their feed slots.
const BASELINE_HEADER: HeaderConfig = {
  headerClass: "relative bg-surface-0/90 backdrop-blur-md",
  stripClass:
    "relative flex overflow-x-scroll snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [scrollbar-width:none] h-[44px] items-center px-[calc(50%-40px)]",
  // Labels fade out at both edges instead of hard-clipping; the wider right
  // ramp keeps them legible until they tuck under the search button.
  maskStyle: {
    maskImage:
      "linear-gradient(to right, transparent 0, black 32px, black calc(100% - 88px), transparent calc(100% - 36px))",
    WebkitMaskImage:
      "linear-gradient(to right, transparent 0, black 32px, black calc(100% - 88px), transparent calc(100% - 36px))",
  },
  tabClass: (active) =>
    `snap-center shrink-0 px-4 h-[44px] flex items-center justify-center cursor-pointer transition-all duration-200 ${
      active ? "text-ink scale-100 font-semibold" : "text-ink-muted scale-90 font-medium"
    }`,
  indicatorClass: "absolute bottom-0 h-[4px] w-4 rounded-full pointer-events-none",
  renderSearch: (onSearch) => (
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
  ),
}

// The indicator-positioning JS in page.tsx needs the config of arbitrary
// tabs mid-swipe (lockIndicatorColor / trackIndicatorWidth).
export function headerConfigFor(design: DesignId | null): HeaderConfig {
  return designModule(design)?.headerConfig ?? BASELINE_HEADER
}

interface FeedHeaderProps {
  tabs: FeedTab[]
  activeTab: string
  design: DesignId | null
  onTabClick: (index: number) => void
  onSearch: () => void
  // Refs stay owned by the feed page: the scroll-sync listeners that position
  // the indicator live there, next to the horizontal pager they read from.
  tabRefs: MutableRefObject<Record<string, HTMLButtonElement | null>>
  indicatorRef: RefObject<HTMLDivElement | null>
  tabStripRef: RefObject<HTMLDivElement | null>
}

// Tab bar skeleton — one scroll-synced strip shared by every design; the
// look comes entirely from the active design's HeaderConfig.
export default function FeedHeader({
  tabs,
  activeTab,
  design,
  onTabClick,
  onSearch,
  tabRefs,
  indicatorRef,
  tabStripRef,
}: FeedHeaderProps) {
  const config = headerConfigFor(design)

  return (
    <div className="absolute top-0 left-0 right-0 z-20" data-design={design ?? undefined}>
      <div className={config.headerClass}>
        {config.renderSearch(onSearch)}
        {/* Scrollable tab strip */}
        <div ref={tabStripRef} className={config.stripClass} style={config.maskStyle}>
          {tabs.map((tab, i) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el }}
                onClick={() => onTabClick(i)}
                className={config.tabClass(isActive)}
              >
                {config.renderTabLabel ? (
                  config.renderTabLabel(tab, isActive)
                ) : (
                  <span className="text-sm whitespace-nowrap">{tab.label}</span>
                )}
              </button>
            )
          })}
          {/* Single sliding indicator — positioned in scroll-content space.
              JS owns inline left (and width when tracked); color is inline
              only for designs that interpolate it. */}
          <div
            ref={indicatorRef}
            className={config.indicatorClass}
            style={{
              left: 0,
              backgroundColor: config.lockIndicatorColor ? undefined : "rgb(239,233,222)",
            }}
          />
        </div>
      </div>
    </div>
  )
}
