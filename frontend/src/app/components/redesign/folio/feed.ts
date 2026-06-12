// Folio (books + facts) — feed slot wiring. Null slots render baseline.

import type { FeedSlots } from "../types"
import FolioCard from "./FolioCard"
import { FolioFeedLoading, FolioFeedEmpty } from "./FolioFeedStates"
import FolioBottomNav from "./FolioBottomNav"
import { folioHeaderConfig } from "./folioHeader"

export const folioFeed: FeedSlots = {
  Card: FolioCard,
  FeedLoading: FolioFeedLoading,
  FeedEmpty: FolioFeedEmpty,
  BottomNav: FolioBottomNav,
  headerConfig: folioHeaderConfig,
  // Folio's nav is the baseline h-14, so the scroll container keeps pb-14.
  tabPagePaddingClass: "pb-14",
}
