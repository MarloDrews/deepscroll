import type { ApproachContent } from "../../types/post"
import { SectionBlock, SectionLabel, SvgFigure, proseStyle } from "./primitives"
import MathText from "../MathText"
import { colors } from "../../theme/tokens"

// Port of frontend/src/components/sections/ApproachSection.tsx
export default function ApproachSection({
  content,
  isUserContent,
}: {
  content: ApproachContent
  isUserContent: boolean
}) {
  return (
    <SectionBlock gap={16}>
      <SectionLabel>Approach</SectionLabel>
      <MathText text={content.body} style={[proseStyle, { color: colors["ink-dim"] }]} />
      {content.visual_svg ? (
        <SvgFigure svg={content.visual_svg} isUserContent={isUserContent} style={{ marginTop: 4 }} />
      ) : null}
    </SectionBlock>
  )
}
