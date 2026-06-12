import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native"
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated"
import Svg, { Circle, Path } from "react-native-svg"
import type { FeedTabDef } from "../lib/feedTabs"
import { colors, fonts } from "../theme/tokens"

// The 9-tab strip above the feed pager, ported from the tab bar in
// frontend/src/app/page.tsx. A 16x4 dot indicator slides under the active
// tab; its position and color interpolate with the pager's scroll progress
// (the web interpolates left + RGB between adjacent tabs the same way).
// The parent forwards PagerView's onPageScroll into the imperative handle so
// interpolation runs on the UI thread via reanimated.

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
const HALF_INDICATOR = 8

const FeedTabBar = forwardRef<FeedTabBarHandle, Props>(function FeedTabBar(
  { tabs, activeIndex, onTabPress, onSearchPress },
  ref
) {
  const { width: windowWidth } = useWindowDimensions()
  const scrollRef = useRef<ScrollView>(null)
  // Tab center x-positions (content coordinates), filled by onLayout. The
  // plain ref drives the auto-scroll; the shared value drives the indicator.
  const centersRef = useRef<number[]>([])
  const centersSV = useSharedValue<number[]>([])
  const progress = useSharedValue(0)
  const [contentWidth, setContentWidth] = useState(0)

  useImperativeHandle(ref, () => ({
    onPageScroll: (position, offset) => {
      progress.value = position + offset
    },
  }))

  // Keep the active tab centered; clamping makes the first tab settle flush
  // left and the last flush right, like the web tab strip.
  useEffect(() => {
    const center = centersRef.current[activeIndex]
    if (center === undefined || contentWidth === 0) return
    const max = Math.max(0, contentWidth - windowWidth)
    const x = Math.min(Math.max(center - windowWidth / 2, 0), max)
    scrollRef.current?.scrollTo({ x, animated: true })
  }, [activeIndex, contentWidth, windowWidth])

  const indicatorStyle = useAnimatedStyle(() => {
    const centers = centersSV.value
    if (centers.length < tabs.length) return { opacity: 0 }
    const inputRange = tabs.map((_, i) => i)
    return {
      opacity: 1,
      transform: [
        {
          translateX: interpolate(
            progress.value,
            inputRange,
            centers.map((c) => c - HALF_INDICATOR)
          ),
        },
      ],
      backgroundColor: interpolateColor(
        progress.value,
        inputRange,
        tabs.map((t) => t.accent)
      ),
    }
  })

  // The web pads the strip with calc(50% - 40px) so edge tabs can center.
  const edgeSpacer = Math.max(0, windowWidth / 2 - 40)

  return (
    <View style={{ height: STRIP_HEIGHT, backgroundColor: colors["surface-0"] }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={(w) => setContentWidth(w)}
        contentContainerStyle={{ alignItems: "center" }}
      >
        <View style={{ width: edgeSpacer }} />
        {tabs.map((tab, i) => {
          const active = i === activeIndex
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabPress(i)}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout
                centersRef.current[i] = x + width / 2
                if (centersRef.current.filter((c) => c !== undefined).length === tabs.length) {
                  centersSV.value = [...centersRef.current]
                }
              }}
              style={{
                height: STRIP_HEIGHT,
                paddingHorizontal: 16,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: active ? fonts.sansSemiBold : fonts.sansMedium,
                  fontSize: 14,
                  color: active ? colors.ink : colors["ink-muted"],
                  transform: [{ scale: active ? 1 : 0.9 }],
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          )
        })}
        <View style={{ width: edgeSpacer }} />
        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: 0,
              left: 0,
              width: HALF_INDICATOR * 2,
              height: 4,
              borderRadius: 999,
            },
            indicatorStyle,
          ]}
        />
      </ScrollView>

      {/* Search lives top-right above the strip on web; inert this phase. */}
      <Pressable
        onPress={onSearchPress}
        style={{
          position: "absolute",
          right: 4,
          top: 0,
          width: STRIP_HEIGHT,
          height: STRIP_HEIGHT,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors["surface-0"],
        }}
      >
        <Svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors["ink-dim"]}
          strokeWidth={2}
          strokeLinecap="round"
        >
          <Circle cx={11} cy={11} r={8} />
          <Path d="m21 21-4.35-4.35" />
        </Svg>
      </Pressable>
    </View>
  )
})

export default FeedTabBar
