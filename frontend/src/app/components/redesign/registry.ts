// Static registry of the three design variant modules. Dispatch sites look
// up their slot here; a null slot (or null design) falls back to baseline.

import type { DesignId } from "@/lib/redesign"
import type { DesignModule } from "./types"
import { folioFeed } from "./folio/feed"
import { folioDetail } from "./folio/detail"
import { consoleFeed } from "./console/feed"
import { consoleDetail } from "./console/detail"
import { stageFeed } from "./stage/feed"
import { stageDetail } from "./stage/detail"

const DESIGN_MODULES: Record<DesignId, DesignModule> = {
  folio: { ...folioFeed, ...folioDetail },
  console: { ...consoleFeed, ...consoleDetail },
  stage: { ...stageFeed, ...stageDetail },
}

export function designModule(design: DesignId | null): DesignModule | null {
  return design ? DESIGN_MODULES[design] : null
}
