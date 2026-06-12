import type { SettingContent } from "../../types/post"
import { SectionBlock, SectionLabel, Prose, CaptionedImage } from "./primitives"

// Port of frontend/src/components/sections/SettingSection.tsx
export default function SettingSection({ content }: { content: SettingContent }) {
  return (
    <SectionBlock gap={16}>
      <SectionLabel>Setting</SectionLabel>
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
