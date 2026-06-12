// Folio header config: a running-head strip. Plain small-caps serif words
// over a hairline; the active tab is marked by a tiny middot in the format
// ink, never by the sliding indicator (kept invisible and color-locked).

import type { HeaderConfig } from "../types"

export const folioHeaderConfig: HeaderConfig = {
  headerClass: "relative bg-surface-0/95 backdrop-blur-md border-b border-edge",
  stripClass:
    "relative flex overflow-x-scroll snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [scrollbar-width:none] h-[44px] items-center px-[calc(50%-40px)]",
  // Same edge-fade as baseline; the wider right ramp clears the 44px search glyph.
  maskStyle: {
    maskImage:
      "linear-gradient(to right, transparent 0, black 32px, black calc(100% - 92px), transparent calc(100% - 44px))",
    WebkitMaskImage:
      "linear-gradient(to right, transparent 0, black 32px, black calc(100% - 92px), transparent calc(100% - 44px))",
  },
  tabClass: (active) =>
    `snap-center shrink-0 px-4 h-[44px] flex items-center justify-center cursor-pointer transition-colors duration-200 ${
      active ? "text-ink" : "text-ink-faint hover:text-ink-muted"
    }`,
  renderTabLabel: (tab, active) => (
    <span className="flex items-center gap-1.5 whitespace-nowrap font-serif text-xs uppercase tracking-wide">
      {/* Dot is always laid out so tab widths stay stable mid-swipe; it only
          becomes visible (format ink, or neutral on mixed tabs) when active. */}
      <span
        aria-hidden
        className={`transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`}
        style={{ color: tab.format ? tab.accent : "var(--color-ink-dim)" }}
      >
        &middot;
      </span>
      {tab.label}
    </span>
  ),
  // No visible indicator in Folio; zero-height and transparent, but still
  // positioned by the shared scroll-sync JS.
  indicatorClass: "absolute bottom-0 h-0 w-4 opacity-0 pointer-events-none",
  lockIndicatorColor: true,
  renderSearch: (onSearch) => (
    <button
      onClick={onSearch}
      aria-label="Search"
      className="absolute right-0 top-0 h-[44px] w-11 flex items-center justify-center text-ink-dim hover:text-ink transition-colors duration-150 cursor-pointer z-20"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    </button>
  ),
}
