import { View } from "react-native"
import { SectionBlock, Prose } from "./primitives"
import { useAccent } from "../../lib/accent"

// Port of frontend/src/components/sections/WhyEnduresSection.tsx
// Prose with an accent left border.
export default function WhyEnduresSection({ content }: { content: string }) {
  const accent = useAccent()
  return (
    <SectionBlock>
      <View style={{ borderLeftWidth: 2, borderLeftColor: accent, paddingLeft: 16 }}>
        <Prose>{content}</Prose>
      </View>
    </SectionBlock>
  )
}
