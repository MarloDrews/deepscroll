import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, View } from "react-native"
import type { LayoutChangeEvent } from "react-native"
import { useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import PagerView from "react-native-pager-view"
import { getInterestSlugs } from "../lib/interests"
import { TABS } from "../lib/feedTabs"
import { colors } from "../theme/tokens"
import FeedTab from "../components/FeedTab"
import FeedTabBar, { type FeedTabBarHandle } from "../components/FeedTabBar"
import BottomNav from "../components/BottomNav"
import Toast, { useToast } from "../components/Toast"

// Home: the 9-tab feed (For You + Following + 7 formats), ported from
// frontend/src/app/page.tsx. Horizontal swipe between tabs via PagerView;
// each tab is an independent lazily-fetched vertical snap feed (FeedTab).
// Onboarding gate: without stored interest slugs this screen redirects to
// /onboarding, exactly like the web localStorage check.

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  // undefined = still reading storage; string[] = onboarded.
  const [slugs, setSlugs] = useState<string[] | undefined>(undefined)
  const [activeIndex, setActiveIndex] = useState(0)
  const [activated, setActivated] = useState<Set<number>>(() => new Set([0]))
  // Measured height of the pager area; every feed card is exactly this tall,
  // which keeps the vertical paging exact (see FeedTab getItemLayout).
  const [pageHeight, setPageHeight] = useState(0)
  const pagerRef = useRef<PagerView>(null)
  const tabBarRef = useRef<FeedTabBarHandle>(null)
  const { message, show } = useToast()

  useEffect(() => {
    getInterestSlugs().then((stored) => {
      if (!stored || stored.length === 0) router.replace("/onboarding")
      else setSlugs(stored)
    })
  }, [router])

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setPageHeight(e.nativeEvent.layout.height)
  }, [])

  const markActivated = useCallback((index: number) => {
    setActivated((prev) => {
      if (prev.has(index)) return prev
      const next = new Set(prev)
      next.add(index)
      return next
    })
  }, [])

  const goToTab = useCallback(
    (index: number) => {
      setActiveIndex(index)
      markActivated(index)
      pagerRef.current?.setPage(index)
    },
    [markActivated]
  )

  const onComingSoon = useCallback(() => show("Coming soon"), [show])

  // Spinner while the interests gate resolves (or while redirecting).
  if (slugs === undefined) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors["surface-0"],
        }}
      >
        <ActivityIndicator size="large" color={colors.lamp} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors["surface-0"], paddingTop: insets.top }}>
      <FeedTabBar
        ref={tabBarRef}
        tabs={TABS}
        activeIndex={activeIndex}
        onTabPress={goToTab}
        onSearchPress={onComingSoon}
      />
      <View style={{ flex: 1 }} onLayout={onLayout}>
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageScroll={(e) =>
            tabBarRef.current?.onPageScroll(e.nativeEvent.position, e.nativeEvent.offset)
          }
          onPageSelected={(e) => {
            const index = e.nativeEvent.position
            setActiveIndex(index)
            markActivated(index)
          }}
        >
          {TABS.map((tab, i) => (
            // collapsable={false} keeps Android from flattening page views.
            <View key={tab.id} collapsable={false} style={{ flex: 1 }}>
              <FeedTab
                tab={tab}
                slugs={slugs}
                activated={activated.has(i)}
                pageHeight={pageHeight}
                onComingSoon={onComingSoon}
              />
            </View>
          ))}
        </PagerView>
      </View>
      <BottomNav onComingSoon={onComingSoon} />
      <Toast message={message} />
    </View>
  )
}
