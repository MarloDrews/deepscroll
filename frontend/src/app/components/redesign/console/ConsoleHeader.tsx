"use client"

// Console header config — file-folder tabs as squared mono chips with
// two-digit index prefixes. The inverted steel-blue block IS the active
// signal, so the sliding indicator is collapsed to an invisible element.

import type { HeaderConfig } from "../types"

// Two-digit index per tab id, in the fixed TABS order from app/page.tsx.
const TAB_INDEX: Record<string, string> = {
  "for-you": "00",
  following: "01",
  books: "02",
  facts: "03",
  people: "04",
  concepts: "05",
  questions: "06",
  stories: "07",
  academy: "08",
}

export const consoleHeaderConfig: HeaderConfig = {
  headerClass: "relative bg-surface-0/95 backdrop-blur-md border-b border-edge",
  stripClass:
    "relative flex gap-1 overflow-x-scroll snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [scrollbar-width:none] h-[48px] items-center px-[calc(50%-40px)]",
  // Chips fade out before they reach the squared search slot on the right.
  maskStyle: {
    maskImage:
      "linear-gradient(to right, transparent 0, black 32px, black calc(100% - 100px), transparent calc(100% - 52px))",
    WebkitMaskImage:
      "linear-gradient(to right, transparent 0, black 32px, black calc(100% - 100px), transparent calc(100% - 52px))",
  },
  // The button stays a 44px tap target; the chip visual lives in the label.
  tabClass: () =>
    "snap-center shrink-0 h-[44px] px-0.5 flex items-center justify-center cursor-pointer",
  renderTabLabel: (tab, active) => (
    <span
      className={`flex items-center gap-1.5 h-[30px] px-2.5 font-mono text-[11px] uppercase tracking-wider whitespace-nowrap transition-colors duration-200 ${
        active
          ? "bg-[#7888a8] text-[#0a0a0a]"
          : "border border-edge-strong text-ink-muted"
      }`}
    >
      <span>{TAB_INDEX[tab.id] ?? "00"}</span>
      <span>{tab.label}</span>
    </span>
  ),
  // Invisible: the inverted chip carries the active state instead.
  indicatorClass: "absolute bottom-0 h-0 w-0 opacity-0 pointer-events-none",
  lockIndicatorColor: true,
  renderSearch: (onSearch) => (
    <button
      onClick={onSearch}
      aria-label="Search"
      className="absolute right-1 top-1/2 -translate-y-1/2 z-20 h-[44px] w-[48px] flex items-center justify-center gap-1 border border-edge-strong bg-surface-0 text-ink-dim hover:text-ink transition-colors duration-150 cursor-pointer"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <span className="font-mono text-[10px] text-ink-muted leading-none">/</span>
    </button>
  ),
}
