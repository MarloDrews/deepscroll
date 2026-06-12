// Console (people + concepts) — feed slot wiring.

import type { FeedSlots } from "../types"
import ConsoleCard from "./ConsoleCard"
import ConsoleBottomNav from "./ConsoleBottomNav"
import { ConsoleFeedLoading, ConsoleFeedEmpty } from "./ConsoleFeedStates"
import { consoleHeaderConfig } from "./ConsoleHeader"

export const consoleFeed: FeedSlots = {
  Card: ConsoleCard,
  FeedLoading: ConsoleFeedLoading,
  FeedEmpty: ConsoleFeedEmpty,
  BottomNav: ConsoleBottomNav,
  headerConfig: consoleHeaderConfig,
  // Clears the 64px nav dock (h-16) plus breathing room.
  tabPagePaddingClass: "pb-20",
}
