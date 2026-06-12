// Console (people + concepts) — comments + detail chrome slot wiring.

import type { DetailSlots } from "../types"
import ConsoleCommentsSheet from "./ConsoleCommentsSheet"
import {
  ConsoleDetailBack,
  ConsoleDetailHeader,
  ConsoleDetailBar,
  ConsoleCommentsList,
} from "./ConsoleDetailChrome"

export const consoleDetail: DetailSlots = {
  CommentsSheet: ConsoleCommentsSheet,
  DetailBack: ConsoleDetailBack,
  DetailHeader: ConsoleDetailHeader,
  DetailBar: ConsoleDetailBar,
  CommentsList: ConsoleCommentsList,
}
