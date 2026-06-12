import { Text, View } from "react-native"
import { fonts } from "../../theme/tokens"
import { useAccent } from "../../lib/accent"

// Port of frontend/src/components/sections/QuizBadgeSection.tsx
// Accent-tinted pill badge, centered.
export default function QuizBadgeSection({ content }: { content: string }) {
  const accent = useAccent()
  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 8, alignItems: "center" }}>
      <View
        style={{
          backgroundColor: accent + "26",
          borderWidth: 1,
          borderColor: accent + "66",
          borderRadius: 999,
          paddingHorizontal: 16,
          paddingVertical: 6,
        }}
      >
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: accent }}>{content}</Text>
      </View>
    </View>
  )
}
