"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/lib/auth"
import type { DesignId } from "@/lib/redesign"
import { designModule } from "./redesign/registry"
import type { NavItem } from "./redesign/types"

// "search" stays in the union for the search page, which now lives behind the
// top-right button on the feed and highlights nothing down here.
type ActiveTab = "feed" | "search" | "chat" | "create" | "stats" | "profile"

// Inner SVG content per nav item (24x24 viewBox). Variants wrap these in
// their own <svg> element so they control size and stroke weight.
export const NAV_ICONS: Record<NavItem["id"], React.ReactNode> = {
  chat: (
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  ),
  stats: (
    <>
      <rect x="18" y="3" width="3" height="18" />
      <rect x="11" y="8" width="3" height="13" />
      <rect x="4" y="13" width="3" height="8" />
    </>
  ),
  feed: (
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
  ),
  create: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </>
  ),
}

export default function BottomNav({
  activeTab,
  design = null,
}: {
  activeTab: ActiveTab
  // Set only by the feed page (design exploration); every other route renders
  // the baseline nav.
  design?: DesignId | null
}) {
  const router = useRouter()
  const { user } = useAuth()

  // Prefetch the sibling routes so the first tap on a nav item does not pay
  // the route-chunk download (no-op in dev; effective in production builds).
  useEffect(() => {
    router.prefetch("/")
    router.prefetch("/chat")
    router.prefetch("/stats")
    router.prefetch("/create")
    if (user) router.prefetch(`/profile/${user.username}`)
  }, [router, user])

  const items: NavItem[] = [
    { id: "chat", label: "Chat", active: activeTab === "chat", onClick: () => router.push("/chat"), icon: NAV_ICONS.chat },
    { id: "stats", label: "Stats", active: activeTab === "stats", onClick: () => router.push("/stats"), icon: NAV_ICONS.stats },
    { id: "feed", label: "Feed", active: activeTab === "feed", onClick: () => router.push("/"), icon: NAV_ICONS.feed },
    // Create — always dimmed like other inactive nav items
    { id: "create", label: "Create", active: activeTab === "create", onClick: () => router.push("/create"), icon: NAV_ICONS.create },
    { id: "profile", label: "Profile", active: activeTab === "profile", onClick: () => router.push(user ? `/profile/${user.username}` : "/login"), icon: NAV_ICONS.profile },
  ]

  const NavView = designModule(design)?.BottomNav
  if (NavView) return <NavView items={items} />

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 bg-surface-overlay backdrop-blur-md border-t border-edge"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -20px 50px rgb(124 111 255 / 0.18), 0 -50px 100px rgb(91 168 224 / 0.07)",
      }}
    >
      <div className="h-14 flex">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`flex-1 flex items-center justify-center h-full cursor-pointer transition-colors duration-150 ${
              item.active ? "text-lamp" : "text-ink-muted hover:text-ink-dim"
            }`}
            style={
              item.active
                ? { filter: "drop-shadow(0 0 8px rgb(124 111 255 / 1)) drop-shadow(0 0 22px rgb(124 111 255 / 0.8))" }
                : undefined
            }
            aria-label={item.label}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              {item.icon}
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
