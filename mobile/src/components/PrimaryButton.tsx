import { Pressable, Text } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { colors, fonts } from "../theme/tokens"

// The web .btn-primary recipe (lamp gradient fill + lamp border, pill shape)
// as a reusable native button. Used by login, register, onboarding and the
// feed empty states.

interface Props {
  label: string
  onPress: () => void
  disabled?: boolean
}

export default function PrimaryButton({ label, onPress, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({ opacity: disabled ? 0.5 : pressed ? 0.8 : 1 })}
    >
      <LinearGradient
        colors={["rgba(124, 111, 255, 0.18)", "rgba(91, 168, 224, 0.12)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderWidth: 1.5,
          borderColor: "rgba(124, 111, 255, 0.4)",
          borderRadius: 999,
          paddingHorizontal: 20,
          paddingVertical: 12,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.lamp }}>
          {label}
        </Text>
      </LinearGradient>
    </Pressable>
  )
}
