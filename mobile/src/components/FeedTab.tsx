import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native"
import type { ListRenderItemInfo } from "react-native"
import { useRouter } from "expo-router"
import { apiFetch } from "../lib/api"
import { useAuth } from "../lib/auth"
import type { FeedTabDef } from "../lib/feedTabs"
import type { Post } from "../types/post"
import { colors, fonts } from "../theme/tokens"
import PostCard from "./PostCard"
import PrimaryButton from "./PrimaryButton"

// One page of the 9-tab feed (ported from the TabPage logic in the web
// frontend/src/app/page.tsx). Fetches lazily on first activation; the
// Following tab has its own login/empty states and authenticates via
// apiFetch. The vertical FlatList paging is the original phase-1 feed.

interface Props {
  tab: FeedTabDef
  slugs: string[]
  activated: boolean
  pageHeight: number
  onComingSoon: () => void
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        gap: 12,
        backgroundColor: colors["surface-0"],
      }}
    >
      {children}
    </View>
  )
}

export default function FeedTab({ tab, slugs, activated, pageHeight, onComingSoon }: Props) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isFollowing = tab.id === "following"

  // When the logged-in user changes, the Following feed belongs to someone
  // else — reset so the fetch effect runs again.
  useEffect(() => {
    if (isFollowing) {
      setPosts(null)
      setError(null)
    }
  }, [isFollowing, user?.id])

  useEffect(() => {
    if (!activated || posts !== null || error !== null) return
    if (isFollowing) {
      if (authLoading || !user) return
      apiFetch("/api/feed/following")
        .then((r) => (r.ok ? r.json() : []))
        .then((data: Post[]) => setPosts(data))
        .catch(() => setPosts([]))
      return
    }
    if (slugs.length === 0) return
    const params = `interests=${slugs.join(",")}` + (tab.format ? `&format=${tab.format}` : "")
    apiFetch(`/api/feed?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: Post[]) => setPosts(data))
      .catch((e: Error) => setError(e.message))
  }, [activated, posts, error, isFollowing, authLoading, user, slugs, tab.format])

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Post>) => <PostCard post={item} height={pageHeight} />,
    [pageHeight]
  )

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: pageHeight,
      offset: pageHeight * index,
      index,
    }),
    [pageHeight]
  )

  // Never-activated tabs render an empty page so swiping stays cheap.
  if (!activated) {
    return <View style={{ flex: 1, backgroundColor: colors["surface-0"] }} />
  }

  if (isFollowing && !authLoading && !user) {
    return (
      <CenteredMessage>
        <Text
          style={{
            fontFamily: fonts.serifMedium,
            fontSize: 18,
            color: colors.ink,
            textAlign: "center",
          }}
        >
          See posts from people you follow
        </Text>
        <PrimaryButton label="Log in" onPress={() => router.push("/login")} />
      </CenteredMessage>
    )
  }

  if (isFollowing && posts !== null && posts.length === 0) {
    return (
      <CenteredMessage>
        <Text
          style={{
            fontFamily: fonts.serifMedium,
            fontSize: 18,
            color: colors.ink,
            textAlign: "center",
          }}
        >
          Nothing here yet
        </Text>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 14,
            color: colors["ink-muted"],
            textAlign: "center",
          }}
        >
          Posts from people you follow will show up here.
        </Text>
        <PrimaryButton label="Find people" onPress={onComingSoon} />
      </CenteredMessage>
    )
  }

  if (error !== null) {
    return (
      <CenteredMessage>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 15,
            color: colors["ink-dim"],
            textAlign: "center",
          }}
        >
          Could not reach the feed ({error}). Is the backend running and EXPO_PUBLIC_API_URL
          correct?
        </Text>
        <Pressable
          onPress={() => setError(null)}
          style={{
            borderWidth: 1.5,
            borderColor: colors.lamp + "66",
            borderRadius: 999,
            paddingHorizontal: 20,
            paddingVertical: 10,
          }}
        >
          <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.lamp }}>
            Retry
          </Text>
        </Pressable>
      </CenteredMessage>
    )
  }

  if (posts === null || pageHeight === 0) {
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

  if (posts.length === 0) {
    return (
      <CenteredMessage>
        <Text
          style={{
            fontFamily: fonts.serifMedium,
            fontSize: 18,
            color: colors.ink,
            textAlign: "center",
          }}
        >
          Nothing here yet
        </Text>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 14,
            color: colors["ink-muted"],
            textAlign: "center",
          }}
        >
          {tab.format ? `${tab.label} posts are coming soon.` : "Try adjusting your interests."}
        </Text>
      </CenteredMessage>
    )
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(post) => String(post.id)}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      pagingEnabled
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      // Full-screen items: render 1 ahead, keep a small window mounted.
      initialNumToRender={2}
      maxToRenderPerBatch={2}
      windowSize={5}
      removeClippedSubviews
    />
  )
}
