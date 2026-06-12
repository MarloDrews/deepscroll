// Folio (books + facts) — comments + detail chrome slot wiring.
// Null slots render baseline.

import type { DetailSlots } from "../types"
import FolioCommentsSheet from "./FolioCommentsSheet"
import { FolioDetailBack, FolioDetailHeader, FolioDetailBar } from "./FolioDetailChrome"
import FolioCommentsList from "./FolioCommentsList"

export const folioDetail: DetailSlots = {
  CommentsSheet: FolioCommentsSheet,
  DetailBack: FolioDetailBack,
  DetailHeader: FolioDetailHeader,
  DetailBar: FolioDetailBar,
  CommentsList: FolioCommentsList,
}
