import { View } from "react-native"
import type { StyleProp, ViewStyle } from "react-native"
import { useEffect } from "react"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg"
import { fills, radius } from "../theme/tokens"

// Stage primitives shared by the feed and the post detail, mirroring the web
// component vocabulary (frontend globals.css + PostCard.tsx). Slabs are plain
// translucent fills: with many cards mounted in a FlatList, BlurView would be
// expensive and over the near-black base it adds nothing visible. Chrome
// pills use BlurView, which on Android falls back to a translucent layer
// (blurMethod stays "none") and blurs for real on iOS.

// Format-colored glow behind a slab — the web SlabGlow radial gradient
// (accent at 8% alpha fading out by 70% of the radius). Static, gradient
// falloff instead of any blur filter, clipped by the host's overflow.
export function SlabGlow({
  accent,
  style,
}: {
  accent: string
  style: StyleProp<ViewStyle>
}) {
  return (
    <View pointerEvents="none" style={style}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="slab-glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={accent} stopOpacity={0.08} />
            <Stop offset="0.7" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="50%" cy="50%" r="50%" fill="url(#slab-glow)" />
      </Svg>
    </View>
  )
}

// Accent carriers on a slab: a 3px bar on the left edge plus a faint tint
// falling from the top edge. The host slab clips both into its rounded
// corners (overflow: "hidden"). An edge accent, never a border or fill.
export function SlabAccent({ accent }: { accent: string }) {
  return (
    <>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: accent,
        }}
      />
      <LinearGradient
        pointerEvents="none"
        // 8% alpha at the top edge, transparent by 48px down (web from-(--accent)/8).
        colors={[accent + "14", accent + "00"]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, height: 48 }}
      />
    </>
  )
}

// Frosted chrome surface — the web backdrop-blur pills (bg-white/6% + blur).
// BlurView renders the translucent fallback on Android and a real blur on
// iOS; the white fill on top carries the Stage look either way. The dark
// scrim stands in for the legibility the web gets from blurring content
// that scrolls underneath — invisible over the near-black base, it only
// shows where text would otherwise bleed through the chrome. The wrapper
// clips to the given radius.
export function Frosted({
  fill = fills.chrome,
  borderRadius = 9999,
  style,
  children,
}: {
  fill?: string
  borderRadius?: number
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}) {
  return (
    <View
      style={[{ borderRadius, overflow: "hidden", backgroundColor: "rgba(10, 10, 10, 0.85)" }, style]}
    >
      <BlurView tint="dark" intensity={50} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
      <View
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: fill }}
      />
      {children}
    </View>
  )
}

// Loading slab — the web stage-pulse keyframes (opacity 1 <-> 0.45, 1.6s).
export function PulsingSlab({ height, style }: { height: number; style?: StyleProp<ViewStyle> }) {
  const opacity = useSharedValue(1)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [opacity])

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      style={[
        { height, borderRadius: radius.slab, backgroundColor: fills.slab },
        pulse,
        style,
      ]}
    />
  )
}

// Neutral message slab for empty/error/login states (web's slab states).
export function MessageSlab({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: fills.slab,
        borderRadius: radius.slab,
        paddingHorizontal: 32,
        paddingVertical: 40,
        alignItems: "center",
        gap: 12,
        alignSelf: "stretch",
      }}
    >
      {children}
    </View>
  )
}

// Neutral frosted pill button (web .btn-ghost): white/6% fill, ink-body text.
export const ghostPillStyle = {
  backgroundColor: fills.chrome,
  borderRadius: 9999,
  paddingHorizontal: 20,
  paddingVertical: 10,
} as const
