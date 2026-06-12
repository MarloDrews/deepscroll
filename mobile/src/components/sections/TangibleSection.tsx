import { Text, View } from "react-native"
import { SectionBlock, SectionLabel, Prose, sans } from "./primitives"
import { useAccent } from "../../lib/accent"

// Port of frontend/src/components/sections/TangibleSection.tsx
// Bullet list with accent dots.
export default function TangibleSection({ content }: { content: string[] }) {
  const accent = useAccent()
  return (
    <SectionBlock>
      <SectionLabel style={{ marginBottom: 16 }}>Make It Tangible</SectionLabel>
      <View style={{ gap: 12 }}>
        {content.map((line, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
            <Text style={[sans(14, accent), { paddingTop: 4 }]}>{"•"}</Text>
            <Prose style={{ flex: 1 }}>{line}</Prose>
          </View>
        ))}
      </View>
    </SectionBlock>
  )
}
