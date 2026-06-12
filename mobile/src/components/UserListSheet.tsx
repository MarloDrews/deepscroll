import { useEffect } from "react"
import { FlatList, Modal, Pressable, Text, View, useWindowDimensions } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import Svg, { Line } from "react-native-svg"
import { useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, fonts, radius } from "../theme/tokens"
import { Frosted, PulsingSlab } from "./stage"
import Avatar from "./Avatar"
import VerifiedBadge from "./VerifiedBadge"

// Stage floating user-list sheet (followers / following), the RN counterpart
// of the web profile pages' bottom sheet: same shell as CommentsBottomSheet
// (detached 12px-inset Frosted card with the stage-sheet-in spring) without
// the drag handle and input bar. Fetching stays in the screens — the sheet
// only renders what it is given (null = loading).

export interface ListUser {
  username: string
  is_verified: number
  is_private: boolean
  avatar_url: string | null
}

interface Props {
  title: string
  users: ListUser[] | null
  emptyMessage?: string
  onClose: () => void
}

export default function UserListSheet({ title, users, emptyMessage = "Nothing here yet.", onClose }: Props) {
  const router = useRouter()
  const { height: screenHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  // Web stage-sheet-in: rises 48px with a slight scale and a gentle
  // overshoot (cubic-bezier(0.34, 1.3, 0.64, 1), 300ms).
  const springIn = useSharedValue(0)
  useEffect(() => {
    springIn.value = withTiming(1, {
      duration: 300,
      easing: Easing.bezier(0.34, 1.3, 0.64, 1),
    })
  }, [springIn])
  const sheetInStyle = useAnimatedStyle(() => ({
    opacity: springIn.value,
    transform: [
      { translateY: (1 - springIn.value) * 48 },
      { scale: 0.97 + springIn.value * 0.03 },
    ],
  }))

  function openProfile(username: string) {
    onClose()
    router.push(`/profile/${username}`)
  }

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(10, 10, 10, 0.7)", justifyContent: "flex-end" }}
      >
        <Animated.View style={[{ marginHorizontal: 12, marginBottom: 12 }, sheetInStyle]}>
          <Frosted
            fill="rgba(20, 20, 20, 0.95)"
            borderRadius={radius.slab}
            style={{ maxHeight: Math.round(screenHeight * 0.6) }}
          >
            {/* Pressable so taps inside don't bubble to the backdrop */}
            <Pressable onPress={() => {}}>
              {/* Header: capitalized title + close circle */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.sansSemiBold,
                    fontSize: 14,
                    color: colors.ink,
                    textTransform: "capitalize",
                  }}
                >
                  {title}
                </Text>
                <Pressable onPress={onClose} hitSlop={8} style={{ padding: 6 }}>
                  <Svg viewBox="0 0 24 24" width={18} height={18}>
                    <Line x1={18} y1={6} x2={6} y2={18} stroke={colors["ink-muted"]} strokeWidth={2} strokeLinecap="round" />
                    <Line x1={6} y1={6} x2={18} y2={18} stroke={colors["ink-muted"]} strokeWidth={2} strokeLinecap="round" />
                  </Svg>
                </Pressable>
              </View>

              <FlatList
                data={users ?? []}
                keyExtractor={(u) => u.username}
                contentContainerStyle={{
                  paddingHorizontal: 12,
                  paddingTop: 4,
                  paddingBottom: Math.max(insets.bottom, 12),
                }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  users === null ? (
                    <View style={{ gap: 8, paddingVertical: 8 }}>
                      <PulsingSlab height={56} />
                      <PulsingSlab height={56} />
                    </View>
                  ) : (
                    <Text
                      style={{
                        fontFamily: fonts.sans,
                        fontSize: 14,
                        color: colors["ink-muted"],
                        textAlign: "center",
                        paddingVertical: 32,
                      }}
                    >
                      {emptyMessage}
                    </Text>
                  )
                }
                renderItem={({ item: u }) => (
                  <Pressable
                    onPress={() => openProfile(u.username)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 8,
                      borderRadius: 16,
                      backgroundColor: pressed ? "rgba(255, 255, 255, 0.06)" : "transparent",
                    })}
                  >
                    <Avatar username={u.username} avatarUrl={u.avatar_url} size={40} verified={u.is_verified} />
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink }}>
                        @{u.username}
                      </Text>
                      {u.is_verified > 0 && <VerifiedBadge size={14} level={u.is_verified} />}
                    </View>
                  </Pressable>
                )}
              />
            </Pressable>
          </Frosted>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}
