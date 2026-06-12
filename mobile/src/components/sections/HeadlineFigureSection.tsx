import { Text } from "react-native"
import type { HeadlineFigureContent } from "../../types/post"
import { SectionBlock, SvgFigure, CaptionedImage, sans } from "./primitives"
import MathText from "../MathText"
import { colors } from "../../theme/tokens"

// Port of frontend/src/components/sections/HeadlineFigureSection.tsx
export default function HeadlineFigureSection({
  content,
  isUserContent,
}: {
  content: HeadlineFigureContent
  isUserContent: boolean
}) {
  return (
    <SectionBlock gap={12}>
      {content.visual_svg ? (
        <SvgFigure svg={content.visual_svg} isUserContent={isUserContent} />
      ) : null}
      {content.image_url && !content.visual_svg ? (
        <CaptionedImage url={content.image_url} maxWidth={360} />
      ) : null}
      {content.image_caption ? (
        <Text style={[sans(12, colors["ink-muted"], { lineHeight: 19 }), { textAlign: "center" }]}>
          <MathText text={content.image_caption} />
        </Text>
      ) : null}
    </SectionBlock>
  )
}
