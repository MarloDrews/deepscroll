// Shared contract between the dispatch sites (PostCard, page.tsx, BottomNav,
// post/[id]/page.tsx) and the three design variant folders (folio/, console/,
// stage/). Every slot is nullable: null always means "render the baseline".

import type { ComponentType, CSSProperties, MouseEvent, ReactNode } from "react"
import type { Post } from "@/types/post"
import type { FormatStyle } from "@/lib/formats"
import type { Comment } from "@/app/components/CommentsSection"
import type { FeedTab } from "@/app/components/FeedHeader"

// ---- Feed card view (inner content of one full-screen snap card) ----
// PostCard stays the behavior owner (view tracking, like/save state, double
// tap, navigation, sheet mount). A Card variant renders everything inside the
// snap wrapper: format indicator, body, tags, and the action surface.
export interface PostCardViewProps {
  post: Post
  fc: Post["feed_card"]
  style: FormatStyle
  // Entrance animation gate; reduced-motion is already handled upstream.
  visible: boolean
  liked: boolean
  likesCount: number
  saved: boolean
  saveCount: number
  commentsCount: number
  animatingLike: boolean
  animatingSave: boolean
  onLikeAnimEnd: () => void
  onSaveAnimEnd: () => void
  // These handlers already call stopPropagation, so taps on them never
  // trigger the card's delayed navigate(). Any additional tappable surface a
  // variant adds must stop propagation itself.
  onToggleLike: (e: MouseEvent) => void
  onSave: (e: MouseEvent) => void
  onOpenComments: (e: MouseEvent) => void
  onShare: (e: MouseEvent) => void
}

// ---- Comments surface opened from the feed card ----
// Variants own their portal, gestures, and input; they should use
// useComments(postId, onCountChange) and useAuth() like the baseline sheet,
// and must set data-design on their portal root (portals escape the page
// wrapper, so the attribute does not cascade in).
export interface CommentsSheetViewProps {
  postId: number
  onClose: () => void
  onCountChange?: (count: number) => void
}

// ---- Feed loading / empty states (inside one TabPage) ----
export interface FeedStateProps {
  tab: FeedTab
}

// ---- Bottom nav ----
// The baseline BottomNav computes routes/active state and hands variants a
// plain item list. icon is the inner SVG content (paths only) so variants
// control the svg element itself (size, stroke width).
export interface NavItem {
  id: "chat" | "stats" | "feed" | "create" | "profile"
  label: string
  active: boolean
  onClick: () => void
  icon: ReactNode
}

export interface FeedNavProps {
  items: NavItem[]
}

// ---- Post detail page chrome ----
export interface DetailBackProps {
  onClose: () => void
}

export interface DetailHeaderProps {
  post: Post
  style: FormatStyle
}

// The sticky bar owns its draft text; submit goes through onSubmitComment.
export interface DetailBarProps {
  posting: boolean
  onSubmitComment: (body: string) => Promise<void> | void
  liked: boolean
  likesCount: number
  commentCount: number
  onToggleLike: () => void
  saved: boolean
  animatingSave: boolean
  onSaveAnimEnd: () => void
  onToggleSave: () => void
  onShare: () => void
}

export interface CommentsListProps {
  comments: Comment[]
  currentUsername?: string
  onDelete: (id: number) => void
  deletingId: number | null
}

// ---- Feed header (tab strip) configuration ----
// The strip skeleton and its scroll-sync mechanics are shared; a design
// reshapes the header through this config. All class values must be literal
// strings so the Tailwind scanner sees them.
export interface HeaderConfig {
  // Wrapper around the whole header (background, blur, border).
  headerClass: string
  // The scrollable strip element (height, alignment, padding).
  stripClass: string
  // Fade mask over the strip; undefined = no mask.
  maskStyle?: CSSProperties
  // Class for one tab button.
  tabClass: (active: boolean) => string
  // Custom tab label content; defaults to a plain text span.
  renderTabLabel?: (tab: FeedTab, active: boolean) => ReactNode
  // Sliding indicator element. JS owns inline left (and width when tracked);
  // height, rounding, and color come from this class.
  indicatorClass: string
  // Skip the per-frame rgb interpolation write (fixed-color indicators);
  // otherwise the inline backgroundColor would override the class color.
  lockIndicatorColor?: boolean
  // Interpolate indicator width between tab button widths (pill/block styles).
  trackIndicatorWidth?: boolean
  // Search affordance, rendered inside the header wrapper.
  renderSearch: (onSearch: () => void) => ReactNode
}

// ---- Module slots ----
// feed.ts exports FeedSlots, detail.ts exports DetailSlots; the registry
// merges them. Split in two so the two per-design commits ("feed experience"
// and "comments and detail chrome") each wire their own half.
export interface FeedSlots {
  Card: ComponentType<PostCardViewProps> | null
  FeedLoading: ComponentType<FeedStateProps> | null
  FeedEmpty: ComponentType<FeedStateProps> | null
  BottomNav: ComponentType<FeedNavProps> | null
  headerConfig: HeaderConfig | null
  // Bottom padding class for the TabPage scroll container; must clear the
  // design's nav height. null = baseline pb-14.
  tabPagePaddingClass: string | null
}

export interface DetailSlots {
  CommentsSheet: ComponentType<CommentsSheetViewProps> | null
  DetailBack: ComponentType<DetailBackProps> | null
  DetailHeader: ComponentType<DetailHeaderProps> | null
  DetailBar: ComponentType<DetailBarProps> | null
  CommentsList: ComponentType<CommentsListProps> | null
}

export interface DesignModule extends FeedSlots, DetailSlots {}
