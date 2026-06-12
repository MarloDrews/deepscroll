import { useEffect, useRef, useState } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { Image } from "expo-image"
import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { apiFetch } from "../../lib/api"
import { resolveImageUrl } from "../../config"
import { formatStyle } from "../../lib/formats"
import { AccentProvider } from "../../lib/accent"
import { usePostActions } from "../../lib/usePostActions"
import { sharePost } from "../../lib/share"
import { fcStr, type Post } from "../../types/post"
import { colors, fonts } from "../../theme/tokens"
import SectionRenderer from "../../components/SectionRenderer"
import CommentsBottomSheet from "../../components/CommentsBottomSheet"
import VerifiedBadge from "../../components/VerifiedBadge"
import { HeartIcon, BookmarkIcon, BackIcon, ShareIcon } from "../../components/icons"

// Port of frontend/src/app/post/[id]/page.tsx: full-screen detail that
// slides up over the feed (Stack animation), swipe right to close (same
// dx > 80 && dx > |dy| rule as the web touch handler). The AccentProvider
// replaces the web's --accent CSS variable for everything below the header.
// Comments live in the shared bottom sheet instead of an inline list.

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const postId = Number(id)
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [post, setPost] = useState<Post | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [showComments, setShowComments] = useState(false)

  const { liked, likesCount, saved, toggleLike, toggleSave } = usePostActions(postId, 0)

  const isClosingRef = useRef(false)

  useEffect(() => {
    apiFetch(`/api/posts/${postId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Post | null) => {
        if (!data) setNotFound(true)
        else setPost(data)
      })
      .catch(() => setNotFound(true))
  }, [postId])

  function close() {
    if (isClosingRef.current) return
    isClosingRef.current = true
    router.back()
  }

  // Swipe right to close (web: dx > 80 && dx > |dy| in a touchend handler).
  // A plain onTouchEnd on the ScrollView never fires once the scroll claims
  // the gesture, so this is a gesture-handler Pan that only activates on
  // clearly horizontal movement (vertical scrolling and taps stay untouched).
  const swipeClose = Gesture.Pan()
    .activeOffsetX(40)
    .failOffsetX(-20)
    .failOffsetY([-30, 30])
    .runOnJS(true)
    .onEnd((e) => {
      if (e.translationX > 80 && e.translationX > Math.abs(e.translationY)) close()
    })

  const style = post ? formatStyle(post.format) : null

  return (
    <View style={{ flex: 1, backgroundColor: colors["surface-0"] }}>
      <Stack.Screen options={{ animation: "slide_from_bottom", animationDuration: 300 }} />

      {/* Back button */}
      <Pressable
        onPress={close}
        hitSlop={8}
        style={{
          position: "absolute",
          top: insets.top + 12,
          left: 16,
          zIndex: 10,
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors["surface-overlay"],
          borderWidth: 1,
          borderColor: colors.edge,
        }}
      >
        <BackIcon size={24} color={colors.ink} />
      </Pressable>

      {post && style ? (
        <AccentProvider value={style.accent}>
          <GestureDetector gesture={swipeClose}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: insets.top + 64, paddingBottom: 32 }}
            style={{ flex: 1 }}
          >
            {/* Header: badge + attribution + cover + title + tags */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
              {/* Format badge */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: style.accent }} />
                <Text
                  style={{
                    fontFamily: fonts.sansSemiBold,
                    fontSize: 11,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: style.accent,
                  }}
                >
                  {style.badge}
                </Text>
              </View>

              {/* Attribution */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 16 }}>
                {post.is_user_content && post.author_username ? (
                  <>
                    <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-muted"] }}>
                      Submitted by @{post.author_username}
                    </Text>
                    {post.author_is_verified != null && post.author_is_verified > 0 && (
                      <VerifiedBadge size={16} level={post.author_is_verified} />
                    )}
                  </>
                ) : !post.is_user_content ? (
                  <>
                    <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-muted"] }}>
                      Deepscroll
                    </Text>
                    <VerifiedBadge size={12} variant="official" />
                  </>
                ) : null}
              </View>

              {/* Books cover */}
              {post.format === "books" && fcStr(post.feed_card, "cover_url") !== "" && (
                <View style={{ alignItems: "center", marginBottom: 20 }}>
                  <Image
                    source={{ uri: resolveImageUrl(fcStr(post.feed_card, "cover_url")) }}
                    style={{
                      width: 128,
                      height: 192,
                      borderRadius: 8,
                      backgroundColor: colors["surface-2"],
                      borderWidth: 1,
                      borderColor: colors.edge,
                    }}
                    contentFit="cover"
                    transition={150}
                  />
                </View>
              )}

              {/* Title */}
              <Text
                style={{
                  fontFamily: fonts.serifMedium,
                  fontSize: 30,
                  lineHeight: 38,
                  color: colors.ink,
                  marginBottom: 4,
                }}
              >
                {post.title}
              </Text>

              {/* Author (Books) */}
              {post.format === "books" && fcStr(post.feed_card, "author") !== "" && (
                <Text
                  style={{
                    fontFamily: fonts.sansMedium,
                    fontSize: 14,
                    color: style.accent,
                    marginBottom: 16,
                  }}
                >
                  {fcStr(post.feed_card, "author")}
                </Text>
              )}

              {/* Interest tags */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                {post.interests.map((name) => (
                  <View
                    key={name}
                    style={{
                      backgroundColor: colors["surface-2"],
                      borderWidth: 1,
                      borderColor: colors.edge,
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-dim"] }}>
                      {name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Sections */}
            <SectionRenderer
              sections={post.sections}
              isUserContent={post.is_user_content}
              postId={post.id}
            />
          </ScrollView>
          </GestureDetector>

          {/* Bottom action bar (web sticky comment bar): comment field opens
              the bottom sheet; like/save light up lamp like the web detail. */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.edge,
              backgroundColor: colors["surface-overlay"],
              paddingHorizontal: 12,
              paddingTop: 8,
              paddingBottom: 8 + insets.bottom,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Pressable
              onPress={() => setShowComments(true)}
              style={{
                flex: 1,
                backgroundColor: colors["surface-2"],
                borderWidth: 1,
                borderColor: colors.edge,
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 9,
              }}
            >
              <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors["ink-muted"] }}>
                Add a comment...
              </Text>
            </Pressable>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Pressable
                onPress={toggleLike}
                hitSlop={4}
                style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
              >
                <HeartIcon size={20} color={liked ? colors.lamp : colors["ink-dim"]} filled={liked} />
              </Pressable>
              <Pressable
                onPress={toggleSave}
                hitSlop={4}
                style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
              >
                <BookmarkIcon size={20} color={saved ? colors.lamp : colors["ink-dim"]} filled={saved} />
              </Pressable>
              <Pressable
                onPress={() => sharePost(post)}
                hitSlop={4}
                style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
              >
                <ShareIcon size={20} color={colors["ink-dim"]} />
              </Pressable>
            </View>
          </View>

          {showComments && (
            <CommentsBottomSheet postId={post.id} onClose={() => setShowComments(false)} />
          )}
        </AccentProvider>
      ) : notFound ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 }}>
          <Text style={{ fontFamily: fonts.serifMedium, fontSize: 18, color: colors.ink, textAlign: "center" }}>
            Post not found
          </Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors["ink-muted"], textAlign: "center" }}>
            It may have been removed or is awaiting review.
          </Text>
          <Pressable onPress={close}>
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 14,
                color: colors["ink-dim"],
                textDecorationLine: "underline",
              }}
            >
              Go back
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors["ink-faint"] }}>Loading...</Text>
        </View>
      )}
    </View>
  )
}
