import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native"
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, { Circle, Path } from "react-native-svg"
import type { FeedTabDef } from "../lib/feedTabs"
import { colors, fills, fonts } from "../theme/tokens"
import { Frosted } from "./stage"

// Stage feed header, ported from frontend FeedHeader.tsx: a floating frosted
// capsule detached from the top edge with a separate frosted search circle to
// its right. The sliding indicator is the neutral active pill fill itself
// (white/10%) — its position and width interpolate with the pager's scroll
// progress on the UI thread. The capsule stays neutral; the only accent is
// the format dot on the active tab label (no color interpolation — accents
// switch hard with the settled tab, per the Stage accent policy).

export interface FeedTabBarHandle {
  onPageScroll: (position: number, offset: number) => void
}

interface Props {
  tabs: FeedTabDef[]
  activeIndex: number
  onTabPress: (index: number) => void
  onSearchPress: () => void
}

const STRIP_HEIGHT = 44
const INDICATOR_HEIGHT = 36

const FeedTabBar = forwardRef<FeedTabBarHandle, Props>(function FeedTabBar(
  { tabs, activeIndex, onTabPress, onSearchPress },
  ref
) {
  const { width: windowWidth } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const scrollRef = useRef<ScrollView>(null)
  // Tab bounds (content coordinates), filled by onLayout. The plain refs
  // drive the auto-scroll; the shared values drive the indicator.
  const boundsRef = useRef<{ x: number; width: number }[]>([])
  const xsSV = useSharedValue<number[]>([])
  const widthsSV = useSharedValue<number[]>([])
  // Starts on the initial tab so the indicator instant-aligns on mount
  // (the pager opens on For You, not index 0, like the web).
  const progress = useSharedValue(activeIndex)
  const [contentWidth, setContentWidth] = useState(0)
  // Measured capsule width (window minus insets and the search circle).
  const [stripWidth, setStripWidth] = useState(0)

  useImperativeHandle(ref, () => ({
    onPageScroll: (position, offset) => {
      progress.value = position + offset
    },
  }))

  // Keep the active tab centered; clamping makes the first tab settle flush
  // left and the last flush right, like the web tab strip.
  useEffect(() => {
    const bounds = boundsRef.current[activeIndex]
    if (bounds === undefined || contentWidth === 0 || stripWidth === 0) return
    const center = bounds.x + bounds.width / 2
    const max = Math.max(0, contentWidth - stripWidth)
    const x = Math.min(Math.max(center - stripWidth / 2, 0), max)
    scrollRef.current?.scrollTo({ x, animated: true })
  }, [activeIndex, contentWidth, stripWidth])

  const indicatorStyle = useAnimatedStyle(() => {
    const xs = xsSV.value
    const widths = widthsSV.value
    if (xs.length < tabs.length || widths.length < tabs.length) return { opacity: 0 }
    const inputRange = tabs.map((_, i) => i)
    return {
      opacity: 1,
      transform: [{ translateX: interpolate(progress.value, inputRange, xs) }],
      width: interpolate(progress.value, inputRange, widths),
    }
  })

  // The web pads the strip with calc(50% - 40px) so edge tabs can center.
  const edgeSpacer = Math.max(0, stripWidth / 2 - 40)

  return (
    <View
      style={{
        position: "absolute",
        top: insets.top + 12,
        left: 12,
        right: 12,
        zIndex: 20,
        flexDirection: "row",
        gap: 8,
      }}
    >
      <Frosted
        style={{ flex: 1, height: STRIP_HEIGHT }}
        borderRadius={999}
      >
        <View style={{ flex: 1 }} onLayout={(e) => setStripWidth(e.nativeEvent.layout.width)}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onContentSizeChange={(w) => setContentWidth(w)}
            contentContainerStyle={{ alignItems: "center" }}
          >
            {/* Sliding indicator — the neutral active pill fill, painted
                before the tabs so labels stay on top. */}
            <Animated.View
              style={[
                {
                  position: "absolute",
                  left: 0,
                  top: (STRIP_HEIGHT - INDICATOR_HEIGHT) / 2,
                  height: INDICATOR_HEIGHT,
                  borderRadius: 999,
                  backgroundColor: fills.active10,
                },
                indicatorStyle,
              ]}
            />
            <View style={{ width: edgeSpacer }} />
            {tabs.map((tab, i) => {
              const active = i === activeIndex
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => onTabPress(i)}
                  onLayout={(e) => {
                    const { x, width } = e.nativeEvent.layout
                    boundsRef.current[i] = { x, width }
                    if (boundsRef.current.filter(Boolean).length === tabs.length) {
                      xsSV.value = boundsRef.current.map((b) => b.x)
                      widthsSV.value = boundsRef.current.map((b) => b.width)
                    }
                  }}
                  style={{
                    height: STRIP_HEIGHT,
                    paddingHorizontal: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {/* The format dot is always laid out so the button width
                      never changes with active state (the indicator width
                      interpolation reads measured widths); it only becomes
                      visible on the active tab. */}
                  {tab.format && (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: tab.accent,
                        opacity: active ? 1 : 0,
                      }}
                    />
                  )}
                  {/* The label width must not change with active state, or
                      activating a tab would reflow the strip and the indicator
                      (which reads measured widths) would no longer match. An
                      invisible semibold copy reserves the widest width; the
                      visible text is centered over it and only swaps weight. */}
                  <View style={{ alignItems: "center", justifyContent: "center" }}>
                    <Text
                      style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, opacity: 0 }}
                    >
                      {tab.label}
                    </Text>
                    <Text
                      style={{
                        position: "absolute",
                        fontFamily: active ? fonts.sansSemiBold : fonts.sansMedium,
                        fontSize: 14,
                        color: active ? colors.ink : colors["ink-muted"],
                      }}
                    >
                      {tab.label}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
            <View style={{ width: edgeSpacer }} />
          </ScrollView>
        </View>
      </Frosted>

      {/* Floating frosted search circle (inert this phase, like before) */}
      <Frosted style={{ width: STRIP_HEIGHT, height: STRIP_HEIGHT }} borderRadius={999}>
        <Pressable
          onPress={onSearchPress}
          style={({ pressed }) => ({
            width: STRIP_HEIGHT,
            height: STRIP_HEIGHT,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          {/* The Svg fills the circle and the viewBox centers/scales the
              icon. react-native-svg does not reliably honor the parent's flex
              centering (it pins to the top-left), so we center via the viewBox
              instead: the 24-unit icon art sits centered in a 44-unit box. */}
          <Svg
            width={STRIP_HEIGHT}
            height={STRIP_HEIGHT}
            viewBox="-10 -10 44 44"
            fill="none"
            stroke={colors["ink-dim"]}
            strokeWidth={2}
            strokeLinecap="round"
          >
            <Circle cx={11} cy={11} r={8} />
            <Path d="m21 21-4.35-4.35" />
          </Svg>
        </Pressable>
      </Frosted>
    </View>
  )
})

export default FeedTabBar
