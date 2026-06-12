import { Pressable, Text } from "react-native"
import { fonts } from "../theme/tokens"

// The web Stage .btn-primary recipe: a flat lamp-tinted pill (no gradient,
// no border) with a springy press scale. Used by login, register, onboarding
// and the feed empty states.

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
      style={({ pressed }) => ({
        backgroundColor: "rgba(124, 111, 255, 0.15)",
        borderRadius: 999,
        paddingHorizontal: 20,
        paddingVertical: 10,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.45 : 1,
        transform: [{ scale: pressed && !disabled ? 0.96 : 1 }],
      })}
    >
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: "#9d93ff" }}>{label}</Text>
    </Pressable>
  )
}
