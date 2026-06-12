import type { TheTurnContent } from "../../types/post"
import { SectionBlock, SectionLabel, Prose, CaptionedImage } from "./primitives"

// Port of frontend/src/components/sections/TheTurnSection.tsx
export default function TheTurnSection({ content }: { content: TheTurnContent }) {
  return (
    <SectionBlock gap={16}>
      <SectionLabel>The Turn</SectionLabel>
      <Prose>{content.body}</Prose>
      {content.image_url ? (
        <CaptionedImage
          url={content.image_url}
          caption={content.image_caption}
          attribution={content.image_attribution}
          height={230}
        />
      ) : null}
    </SectionBlock>
  )
}
