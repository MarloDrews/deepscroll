import { SectionBlock, SectionLabel, proseStyle } from "./primitives"
import MathText from "../MathText"

// Port of frontend/src/components/sections/TldrSection.tsx
export default function TldrSection({ content }: { content: string }) {
  return (
    <SectionBlock>
      <SectionLabel style={{ marginBottom: 12 }}>TL;DR</SectionLabel>
      <MathText text={content} style={proseStyle} />
    </SectionBlock>
  )
}
