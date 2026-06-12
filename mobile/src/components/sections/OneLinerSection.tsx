import { Text, View } from "react-native"
import { colors, fonts } from "../../theme/tokens"

// Port of frontend/src/components/sections/OneLinerSection.tsx
export default function OneLinerSection({ content }: { content: string }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 32 }}>
      <Text style={{ fontFamily: fonts.serifMedium, fontSize: 20, lineHeight: 27, color: colors.ink }}>
        {content}
      </Text>
    </View>
  )
}
