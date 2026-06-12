import { useCallback, useEffect, useState } from "react"
import { FlatList, Pressable, Text, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, { Circle, Path } from "react-native-svg"
import { useAuth } from "../../lib/auth"
import { apiFetch } from "../../lib/api"
import { toggleFollow } from "../../lib/follow"
import { getSavedPostIds } from "../../lib/savedPosts"
import { getLikedPostIds } from "../../lib/likedPosts"
import { colors, fills, fonts } from "../../theme/tokens"
import { Frosted, MessageSlab, PulsingSlab } from "../../components/stage"
import { BackIcon } from "../../components/icons"
import Avatar from "../../components/Avatar"
import VerifiedBadge from "../../components/VerifiedBadge"
import PostRow from "../../components/PostRow"
import SegmentedTabs from "../../components/SegmentedTabs"
import UserListSheet, { type ListUser } from "../../components/UserListSheet"
import BottomNav from "../../components/BottomNav"
import Toast, { useToast } from "../../components/Toast"

// Port of frontend/src/app/profile/[username]/page.tsx (Stage): public
// profile with stats row, follow pill (optimistic, same count adjustments as
// the web SWR mutate) and, on the own profile, Posts|Saved|Liked tabs. One
// structural deviation: the web nests a height-clamped horizontal snap pager
// inside the vertical scroller; in RN the whole screen is a single vertical
// FlatList and the tabs switch by tap (no swipe) — a nested pager would need
// per-page height measurement and fight the back gesture.

interface ProfileData {
  username: string
  is_verified: number
  is_private: boolean
  bio: string | null
  avatar_url: string | null
  follower_count: number
  following_count: number
  post_count: number
  follow_status: string | null
}

interface EloData {
  global_rating: number | null
  formats: Record<string, { rating: number; answered_count: number }>
}

interface RowPost {
  id: number
  format: string
  title: string
}

const TAB_ORDER = ["posts", "saved", "liked"] as const

// Plain object styles on every Pressable in this file: NativeWind's
// css-interop drops Pressable style callback functions (nativewind #1105).
function HeaderCircle({ onPress, children }: { onPress?: () => void; children: React.ReactNode }) {
  return (
    <Frosted borderRadius={999} style={{ width: 44, height: 44 }}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        hitSlop={8}
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        {children}
      </Pressable>
    </Frosted>
  )
}

// Full-width follow / edit pill (web .btn-primary / .btn-ghost w-full).
function WidePill({
  label,
  onPress,
  variant,
  disabled,
}: {
  label: string
  onPress: () => void
  variant: "primary" | "ghost"
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: variant === "primary" ? "rgba(124, 111, 255, 0.15)" : fills.chrome,
        borderRadius: 999,
        paddingVertical: 10,
        alignItems: "center",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.sansMedium,
          fontSize: 14,
          color: variant === "primary" ? "#9d93ff" : colors["ink-body"],
        }}
      >
        {label}
      </Text>
    </Pressable>
  )
}

export default function PublicProfileScreen() {
  const params = useLocalSearchParams<{ username: string; tab?: string }>()
  const username = params.username
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { message, show } = useToast()

  const isOwnProfile = user?.username === username

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [elo, setElo] = useState<EloData | null>(null)
  const [posts, setPosts] = useState<RowPost[] | null>(null)
  const [savedPosts, setSavedPosts] = useState<RowPost[] | null>(null)
  const [likedPosts, setLikedPosts] = useState<RowPost[] | null>(null)
  const [followLoading, setFollowLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(params.tab === "saved" ? 1 : 0)
  const [listOpen, setListOpen] = useState<"followers" | "following" | null>(null)
  const [listUsers, setListUsers] = useState<ListUser[] | null>(null)

  const activeTab = TAB_ORDER[isOwnProfile ? activeIndex : 0]

  useEffect(() => {
    let cancelled = false
    // The route instance is reused when only the username param changes
    // (e.g. follower list -> another profile), so the previous profile's
    // data and not-found flag must be cleared by hand.
    setProfile(null)
    setNotFound(false)
    setPosts(null)
    setSavedPosts(null)
    setLikedPosts(null)
    apiFetch(`/api/users/${username}/profile`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setProfile(data)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
    apiFetch(`/api/users/${username}/elo`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setElo(data)
      })
      .catch(() => {})
    apiFetch(`/api/feed/user/${username}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled) setPosts(data)
      })
      .catch(() => {
        if (!cancelled) setPosts([])
      })
    return () => {
      cancelled = true
    }
  }, [username])

  // Saved/liked tabs: own profile only, loaded on first tab activation —
  // each id costs one full GET /api/posts/{id} (web behavior preserved).
  useEffect(() => {
    if (!isOwnProfile || activeTab !== "saved" || savedPosts !== null) return
    let cancelled = false
    getSavedPostIds().then((ids) => {
      if (cancelled) return
      if (ids.length === 0) {
        setSavedPosts([])
        return
      }
      Promise.all(
        ids.map((id) => apiFetch(`/api/posts/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null))
      )
        .then((results) => {
          if (!cancelled) setSavedPosts(results.filter(Boolean) as RowPost[])
        })
        .catch(() => {
          if (!cancelled) setSavedPosts([])
        })
    })
    return () => {
      cancelled = true
    }
  }, [isOwnProfile, activeTab, savedPosts])

  useEffect(() => {
    if (!isOwnProfile || activeTab !== "liked" || likedPosts !== null) return
    let cancelled = false
    getLikedPostIds().then((ids) => {
      if (cancelled) return
      if (ids.length === 0) {
        setLikedPosts([])
        return
      }
      Promise.all(
        ids.map((id) => apiFetch(`/api/posts/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null))
      )
        .then((results) => {
          if (!cancelled) setLikedPosts(results.filter(Boolean) as RowPost[])
        })
        .catch(() => {
          if (!cancelled) setLikedPosts([])
        })
    })
    return () => {
      cancelled = true
    }
  }, [isOwnProfile, activeTab, likedPosts])

  function openList(kind: "followers" | "following") {
    setListOpen(kind)
    setListUsers(null)
    apiFetch(`/api/users/${username}/${kind}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setListUsers)
      .catch(() => setListUsers([]))
  }

  const handleFollow = useCallback(async () => {
    if (!profile || followLoading) return
    setFollowLoading(true)
    try {
      const previous = profile.follow_status as "accepted" | "pending" | "none" | null
      const next = await toggleFollow(username, previous)
      // Same optimistic count rule as the web SWR mutate: leaving "accepted"
      // drops a follower, becoming "accepted" adds one, "pending" changes
      // nothing until approved.
      setProfile((p) => {
        if (!p) return p
        let count = p.follower_count
        if (previous === "accepted" && next === "none") count = Math.max(0, count - 1)
        if (next === "accepted" && previous !== "accepted") count = count + 1
        return { ...p, follow_status: next, follower_count: count }
      })
    } finally {
      setFollowLoading(false)
    }
  }, [profile, followLoading, username])

  if (notFound) {
    return (
      <View style={{ flex: 1, backgroundColor: colors["surface-0"], justifyContent: "center", paddingHorizontal: 24 }}>
        <MessageSlab>
          <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors["ink-dim"] }}>Profile not found.</Text>
        </MessageSlab>
      </View>
    )
  }

  const activePosts = activeTab === "posts" ? posts : activeTab === "saved" ? savedPosts : likedPosts
  const emptyMessage = activeTab === "posts" ? "No posts yet." : "Nothing here yet."

  const following = profile?.follow_status === "accepted"
  const requested = profile?.follow_status === "pending"

  const header = profile && (
    <View>
      {/* Header row: back / username / settings or more */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: insets.top + 8,
          paddingBottom: 8,
        }}
      >
        <HeaderCircle onPress={() => router.back()}>
          <BackIcon size={24} color={colors["ink-dim"]} />
        </HeaderCircle>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: fonts.sansSemiBold,
            fontSize: 16,
            color: colors.ink,
          }}
        >
          {username}
        </Text>
        {isOwnProfile ? (
          <HeaderCircle onPress={() => router.push("/profile")}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={3} stroke={colors["ink-dim"]} strokeWidth={2} />
              <Path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                stroke={colors["ink-dim"]}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </HeaderCircle>
        ) : (
          <HeaderCircle>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill={colors["ink-dim"]}>
              <Circle cx={5} cy={12} r={1.5} />
              <Circle cx={12} cy={12} r={1.5} />
              <Circle cx={19} cy={12} r={1.5} />
            </Svg>
          </HeaderCircle>
        )}
      </View>

      {/* Profile section */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <View style={{ marginBottom: 12, alignSelf: "flex-start" }}>
          <Avatar username={username} avatarUrl={profile.avatar_url} size={72} verified={profile.is_verified} />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <Text style={{ fontFamily: fonts.serifMedium, fontSize: 24, color: colors.ink }}>{username}</Text>
          {profile.is_verified > 0 && <VerifiedBadge size={18} level={profile.is_verified} />}
        </View>

        {profile.is_private && (
          <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-muted"], marginBottom: 4 }}>
            Private account
          </Text>
        )}

        {profile.bio ? (
          <Text style={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors["ink-body"], marginBottom: 12 }}>
            {profile.bio}
          </Text>
        ) : null}

        {/* Stats row */}
        <View style={{ flexDirection: "row", gap: 24, marginBottom: 16 }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontFamily: fonts.mono, fontSize: 16, color: colors.ink }}>{profile.post_count}</Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-muted"] }}>Posts</Text>
          </View>
          <Pressable style={{ alignItems: "center" }} onPress={() => openList("followers")}>
            <Text style={{ fontFamily: fonts.mono, fontSize: 16, color: colors.ink }}>{profile.follower_count}</Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-muted"] }}>Followers</Text>
          </Pressable>
          <Pressable style={{ alignItems: "center" }} onPress={() => openList("following")}>
            <Text style={{ fontFamily: fonts.mono, fontSize: 16, color: colors.ink }}>{profile.following_count}</Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-muted"] }}>Following</Text>
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontFamily: fonts.mono, fontSize: 16, color: colors.lamp }}>
              {elo?.global_rating ?? "—"}
            </Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-muted"] }}>Knowledge</Text>
          </View>
        </View>

        {/* Follow / Edit Profile pill */}
        {isOwnProfile ? (
          <WidePill label="Edit Profile" variant="ghost" onPress={() => router.push("/profile")} />
        ) : user ? (
          <WidePill
            label={following ? "Following" : requested ? "Requested" : "Follow"}
            variant={following || requested ? "ghost" : "primary"}
            onPress={handleFollow}
            disabled={followLoading}
          />
        ) : (
          <WidePill label="Follow" variant="primary" onPress={() => router.push("/login")} />
        )}
      </View>

      {/* Own profile: Posts|Saved|Liked switcher (tap to switch) */}
      {isOwnProfile && (
        <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 }}>
          <SegmentedTabs
            labels={["Posts", "Saved", "Liked"]}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
          />
        </View>
      )}
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors["surface-0"] }}>
      {profile ? (
        <FlatList
          data={activePosts ?? []}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item }) => <PostRow post={item} />}
          ListHeaderComponent={header}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 120 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            activePosts === null ? (
              <View style={{ gap: 8, paddingTop: 12 }}>
                <PulsingSlab height={72} />
                <PulsingSlab height={72} />
                <PulsingSlab height={72} />
              </View>
            ) : (
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 14,
                  color: colors["ink-muted"],
                  textAlign: "center",
                  paddingTop: 32,
                }}
              >
                {emptyMessage}
              </Text>
            )
          }
        />
      ) : (
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 16 }}>
          <PulsingSlab height={320} />
        </View>
      )}

      {/* Followers / Following floating sheet */}
      {listOpen && profile && (
        <UserListSheet
          title={listOpen}
          users={listUsers}
          emptyMessage={
            profile.is_private && profile.follow_status !== "accepted" && !isOwnProfile
              ? "This account is private."
              : "Nothing here yet."
          }
          onClose={() => setListOpen(null)}
        />
      )}

      <BottomNav active="profile" onComingSoon={() => show("Coming soon")} />
      <Toast message={message} />
    </View>
  )
}
