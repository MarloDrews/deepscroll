import { Text, View } from "react-native"
import { SectionBlock, Prose, sansSemiBold } from "./primitives"
import { useAccent } from "../../lib/accent"

// Port of frontend/src/components/sections/StructureSection.tsx
// Numbered list with accent numbers.
export default function StructureSection({ content }: { content: string[] }) {
  const accent = useAccent()
  return (
    <SectionBlock gap={12}>
      {content.map((item, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
          <Text style={[sansSemiBold(14, accent), { minWidth: 20, paddingTop: 4 }]}>{i + 1}.</Text>
          <Prose style={{ flex: 1 }}>{item}</Prose>
        </View>
      ))}
    </SectionBlock>
  )
}
