import { useCallback, useEffect, useRef, useState } from "react"
import { Text } from "react-native"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, fonts } from "../theme/tokens"

// Mirrors the web Toast.tsx: a short-lived pill notification above the
// bottom nav. useToast owns the message + auto-hide timer; the component
// only renders.

const TOAST_MS = 1800
const BOTTOM_NAV_HEIGHT = 56

export function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((msg: string) => {
    setMessage(msg)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(null), TOAST_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return { message, show }
}

export default function Toast({ message }: { message: string | null }) {
  const insets = useSafeAreaInsets()
  if (!message) return null
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(300)}
      pointerEvents="none"
      style={{
        position: "absolute",
        bottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24,
        alignSelf: "center",
        backgroundColor: colors["surface-3"],
        borderWidth: 1,
        borderColor: colors.edge,
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
    >
      <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.ink }}>{message}</Text>
    </Animated.View>
  )
}
