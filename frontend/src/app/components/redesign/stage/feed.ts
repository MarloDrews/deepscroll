// Stage (questions + stories) — feed slot wiring.

import type { FeedSlots } from "../types"
import StageCard from "./StageCard"
import { StageFeedEmpty, StageFeedLoading } from "./StageFeedStates"
import StageBottomNav from "./StageBottomNav"
import { stageHeaderConfig } from "./stageHeader"

export const stageFeed: FeedSlots = {
  Card: StageCard,
  FeedLoading: StageFeedLoading,
  FeedEmpty: StageFeedEmpty,
  BottomNav: StageBottomNav,
  headerConfig: stageHeaderConfig,
  // The dock floats 12px off the bottom and is ~56px tall; pb-24 clears it.
  tabPagePaddingClass: "pb-24",
}
