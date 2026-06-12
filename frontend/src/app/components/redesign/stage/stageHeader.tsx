// Stage header — a floating frosted capsule detached from the top edge, with
// a separate frosted search circle to its right. The sliding indicator is the
// active pill fill itself: the shared scroll-sync JS interpolates its left and
// width between tab buttons (trackIndicatorWidth + lockIndicatorColor).

import type { HeaderConfig } from "../types"

export const stageHeaderConfig: HeaderConfig = {
  // Transparent wrapper with padding; the capsule look lives on the strip.
  headerClass: "relative pt-3 px-3",
  // The capsule itself: frosted pill, right margin leaves room for the
  // floating search circle. Center padding keeps edge tabs snappable.
  stripClass:
    "relative flex overflow-x-scroll snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [scrollbar-width:none] h-11 items-center rounded-full backdrop-blur-xl bg-white/[0.06] mr-[52px] px-[calc(50%-40px)]",
  // No fade mask: the capsule background sits on the strip element, so a
  // mask would fade the capsule ends along with the labels.
  tabClass: (active) =>
    `snap-center shrink-0 px-4 h-11 flex items-center justify-center cursor-pointer transition-colors duration-200 ${
      active ? "text-ink font-semibold" : "text-ink-muted font-medium"
    }`,
  // Labels render above the sliding pill fill (z-10). The format dot is
  // always laid out so the button width never changes with active state
  // (the indicator width interpolation reads button widths live); it only
  // becomes visible on the active tab.
  renderTabLabel: (tab, active) => (
    <span className="relative z-10 flex items-center gap-1.5 text-sm whitespace-nowrap">
      {tab.format && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 transition-opacity duration-200 ${
            active ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundColor: tab.accent }}
        />
      )}
      {tab.label}
    </span>
  ),
  indicatorClass:
    "absolute top-1/2 -translate-y-1/2 h-9 rounded-full bg-white/[0.10] pointer-events-none",
  lockIndicatorColor: true,
  trackIndicatorWidth: true,
  renderSearch: (onSearch) => (
    <button
      onClick={onSearch}
      aria-label="Search"
      className="absolute right-3 top-3 w-11 h-11 rounded-full backdrop-blur-xl bg-white/[0.06] flex items-center justify-center text-ink-dim hover:text-ink transition-colors duration-150 cursor-pointer z-20"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
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
