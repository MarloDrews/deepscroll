// Stage (questions + stories) — comments + detail chrome slot wiring.

import type { DetailSlots } from "../types"
import StageCommentsSheet from "./StageCommentsSheet"
import StageCommentsList from "./StageCommentsList"
import { StageDetailBack, StageDetailBar, StageDetailHeader } from "./StageDetailChrome"

export const stageDetail: DetailSlots = {
  CommentsSheet: StageCommentsSheet,
  DetailBack: StageDetailBack,
  DetailHeader: StageDetailHeader,
  DetailBar: StageDetailBar,
  CommentsList: StageCommentsList,
}
