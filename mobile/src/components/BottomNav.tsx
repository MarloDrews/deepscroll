import { Pressable, View } from "react-native"
import { useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, { Circle, Line, Path, Rect } from "react-native-svg"
import { useAuth } from "../lib/auth"
import { colors } from "../theme/tokens"

// Port of frontend/src/app/components/BottomNav.tsx (icon geometries copied
// verbatim). This phase only the feed exists, so Feed is always the active
// item; Chat/Stats/Create (and Profile while logged in) report "coming soon"
// instead of navigating.

const ICON_PROPS = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const

function NavButton({
  onPress,
  active,
  children,
}: {
  onPress: () => void
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", height: "100%" }}
    >
      {/* Soft lamp glow behind the active icon (web: double drop-shadow). */}
      {active && (
        <View
          style={{
            position: "absolute",
            width: 28,
            height: 28,
            borderRadius: 14,
            boxShadow: "0 0 22px 8px rgba(124, 111, 255, 0.35)",
          }}
        />
      )}
      {children}
    </Pressable>
  )
}

export default function BottomNav({ onComingSoon }: { onComingSoon: () => void }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const inactive = colors["ink-muted"]

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.edge,
        backgroundColor: colors["surface-overlay"],
        paddingBottom: insets.bottom,
        boxShadow: "0 -20px 50px rgba(124, 111, 255, 0.18)",
      }}
    >
      <View style={{ height: 56, flexDirection: "row" }}>
        {/* Chat */}
        <NavButton onPress={onComingSoon}>
          <Svg {...ICON_PROPS} stroke={inactive}>
            <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </Svg>
        </NavButton>

        {/* Stats */}
        <NavButton onPress={onComingSoon}>
          <Svg {...ICON_PROPS} stroke={inactive}>
            <Rect x={18} y={3} width={3} height={18} />
            <Rect x={11} y={8} width={3} height={13} />
            <Rect x={4} y={13} width={3} height={8} />
          </Svg>
        </NavButton>

        {/* Feed — always the active tab this phase */}
        <NavButton onPress={() => {}} active>
          <Svg {...ICON_PROPS} stroke={colors.lamp}>
            <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
          </Svg>
        </NavButton>

        {/* Create */}
        <NavButton onPress={onComingSoon}>
          <Svg {...ICON_PROPS} stroke={inactive}>
            <Circle cx={12} cy={12} r={10} />
            <Line x1={12} y1={8} x2={12} y2={16} />
            <Line x1={8} y1={12} x2={16} y2={12} />
          </Svg>
        </NavButton>

        {/* Profile */}
        <NavButton onPress={() => (user ? onComingSoon() : router.push("/login"))}>
          <Svg {...ICON_PROPS} stroke={inactive}>
            <Circle cx={12} cy={8} r={4} />
            <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </Svg>
        </NavButton>
      </View>
    </View>
  )
}
