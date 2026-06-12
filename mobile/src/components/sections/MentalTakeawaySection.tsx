import { SectionBlock, SectionLabel, Prose, SvgFigure } from "./primitives"

// Port of frontend/src/components/sections/MentalTakeawaySection.tsx

interface MentalTakeawayContent {
  body: string
  visual_svg?: string
}

export default function MentalTakeawaySection({
  content,
  isUserContent,
}: {
  content: MentalTakeawayContent
  isUserContent: boolean
}) {
  return (
    <SectionBlock gap={16}>
      <SectionLabel>Mental Takeaway</SectionLabel>
      <Prose>{content.body}</Prose>
      {content.visual_svg ? (
        <SvgFigure svg={content.visual_svg} isUserContent={isUserContent} maxWidth={400} style={{ marginTop: 8 }} />
      ) : null}
    </SectionBlock>
  )
}
