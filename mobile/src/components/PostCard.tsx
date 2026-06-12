import { memo, useRef, useState } from "react"
import { Pressable, Text, View } from "react-native"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { fcNum, fcStr, type Post } from "../types/post"
import { formatStyle } from "../lib/formats"
import { resolveImageUrl } from "../config"
import { usePostActions } from "../lib/usePostActions"
import { sharePost } from "../lib/share"
import { colors, fonts, radius } from "../theme/tokens"
import SafeSvg from "./SafeSvg"
import CommentsBottomSheet from "./CommentsBottomSheet"
import { HeartIcon, BookmarkIcon, CommentIcon, ShareIcon } from "./icons"

// Full-screen feed card, ported from frontend PostCard.tsx (Circuit design).
// Tap opens the post detail; double tap likes (web 300ms double-tap rule).
// Action rail on the right: like (red when active), comments bottom sheet,
// save (yellow when active), share — counts hidden while zero, like the web.
// Every card is exactly `height` tall so FlatList paging snaps one card per
// swipe without measuring.

function DotScale({ value, accent }: { value: number; accent: string }) {
  return (
    <View className="flex-row" style={{ gap: 2 }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i <= value ? accent : colors["surface-3"],
          }}
        />
      ))}
    </View>
  )
}

function Teasers({ items, accent }: { items: string[]; accent: string }) {
  return (
    <View style={{ gap: 6, marginTop: 8 }}>
      {items.map((teaser, i) => (
        <View key={i} className="flex-row items-start" style={{ gap: 10 }}>
          <Text style={{ color: accent, fontSize: 14, lineHeight: 19 }}>{"—"}</Text>
          <Text
            className="flex-1"
            style={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 19, color: colors["ink-dim"] }}
          >
            {teaser}
          </Text>
        </View>
      ))}
    </View>
  )
}

// Uppercase 11px tracked label — the web .label-caps utility.
function LabelCaps({ text, color }: { text: string; color: string }) {
  return (
    <Text
      style={{
        fontFamily: fonts.sansSemiBold,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        color,
      }}
    >
      {text}
    </Text>
  )
}

function MetaBar({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="flex-row items-center"
      style={{ gap: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.edge }}
    >
      {children}
    </View>
  )
}

function MetaText({ text, faint }: { text: string; faint?: boolean }) {
  return (
    <Text
      style={{
        fontFamily: fonts.mono,
        fontSize: 12,
        color: faint ? colors["ink-faint"] : colors["ink-muted"],
      }}
    >
      {text}
    </Text>
  )
}

const titleStyle = {
  fontFamily: fonts.serifMedium,
  fontSize: 28,
  lineHeight: 35,
  letterSpacing: -0.4,
  color: colors.ink,
} as const

const essenceStyle = {
  fontFamily: fonts.serifItalic,
  fontSize: 16,
  lineHeight: 24,
  color: colors["ink-body"],
} as const

function teasersOf(fc: Record<string, unknown>): string[] {
  return Array.isArray(fc.teasers) ? (fc.teasers as string[]) : []
}

function CardBody({ post }: { post: Post }) {
  const fc = post.feed_card
  const accent = formatStyle(post.format).accent
  const minRead = fcNum(fc, "post_reading_time_min")
  const difficulty = fcNum(fc, "post_difficulty")

  if (post.format === "books") {
    return (
      <>
        <View className="flex-row items-start" style={{ gap: 16 }}>
          <View className="flex-1">
            <Text style={titleStyle}>{fcStr(fc, "title")}</Text>
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: accent, marginTop: 4 }}>
              {fcStr(fc, "author")}
            </Text>
          </View>
          {fcStr(fc, "cover_url") !== "" && (
            <Image
              source={{ uri: resolveImageUrl(fcStr(fc, "cover_url")) }}
              style={{
                width: 64,
                height: 96,
                borderRadius: 6,
                backgroundColor: colors["surface-2"],
                borderWidth: 1,
                borderColor: colors.edge,
              }}
              contentFit="cover"
              transition={150}
            />
          )}
        </View>
        <Text style={essenceStyle}>{fcStr(fc, "essence")}</Text>
        <Teasers items={teasersOf(fc)} accent={accent} />
        <MetaBar>
          <DotScale value={difficulty} accent={accent} />
          {minRead > 0 && <MetaText text={`${minRead} min read`} />}
          {fcNum(fc, "year") > 0 && <MetaText text={String(fcNum(fc, "year"))} />}
          <MetaText text="·" faint />
          <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-muted"] }}>
            {fcStr(fc, "genre")}
          </Text>
        </MetaBar>
      </>
    )
  }

  if (post.format === "people") {
    const portrait = (fc.portrait as { image_url?: string } | undefined)?.image_url
    return (
      <>
        <View className="flex-row items-start" style={{ gap: 16 }}>
          {portrait && (
            <Image
              source={{ uri: resolveImageUrl(portrait) }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors["surface-2"],
                borderWidth: 1,
                borderColor: accent + "66",
              }}
              contentFit="cover"
              transition={150}
            />
          )}
          <View className="flex-1">
            {fcStr(fc, "role") !== "" && <LabelCaps text={fcStr(fc, "role")} color={accent} />}
            <Text style={[titleStyle, { marginTop: 2 }]}>{fcStr(fc, "name")}</Text>
            {fcStr(fc, "lifespan") !== "" && (
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors["ink-muted"], marginTop: 2 }}>
                {fcStr(fc, "lifespan")}
              </Text>
            )}
          </View>
        </View>
        <Text style={essenceStyle}>{fcStr(fc, "essence")}</Text>
        <Teasers items={teasersOf(fc)} accent={accent} />
        <MetaBar>
          <DotScale value={difficulty} accent={accent} />
          {minRead > 0 && <MetaText text={`${minRead} min read`} />}
        </MetaBar>
      </>
    )
  }

  if (post.format === "facts") {
    const miniSvg = fcStr(fc, "mini_visual_svg")
    return (
      <>
        {fcStr(fc, "field") !== "" && <LabelCaps text={fcStr(fc, "field")} color={accent} />}
        <Text style={titleStyle}>{fcStr(fc, "headline")}</Text>
        {miniSvg !== "" && (
          <SafeSvg svg={miniSvg} isUserContent={post.is_user_content} width={280} height={120} />
        )}
        <Teasers items={teasersOf(fc)} accent={accent} />
        <MetaBar>
          <DotScale value={difficulty} accent={accent} />
          {minRead > 0 && <MetaText text={`${minRead} min read`} />}
        </MetaBar>
      </>
    )
  }

  if (post.format === "concepts" || post.format === "questions") {
    const title = post.format === "concepts" ? fcStr(fc, "concept_name") : fcStr(fc, "the_question")
    const hook = post.format === "concepts" ? fcStr(fc, "one_line") : fcStr(fc, "framing_line")
    return (
      <>
        {fcStr(fc, "field") !== "" && <LabelCaps text={fcStr(fc, "field")} color={accent} />}
        <Text style={titleStyle}>{title}</Text>
        {hook !== "" && <Text style={essenceStyle}>{hook}</Text>}
        <Teasers items={teasersOf(fc)} accent={accent} />
        <MetaBar>
          <DotScale value={difficulty} accent={accent} />
          {minRead > 0 && <MetaText text={`${minRead} min read`} />}
        </MetaBar>
      </>
    )
  }

  if (post.format === "stories") {
    return (
      <>
        <View className="flex-row flex-wrap items-center" style={{ gap: 8 }}>
          {fcStr(fc, "era_label") !== "" && <LabelCaps text={fcStr(fc, "era_label")} color={accent} />}
          {fcStr(fc, "category") !== "" && (
            <LabelCaps text={fcStr(fc, "category")} color={colors["ink-faint"]} />
          )}
        </View>
        <Text style={[titleStyle, { fontSize: 24, lineHeight: 30 }]}>{fcStr(fc, "headline")}</Text>
        <Teasers items={teasersOf(fc)} accent={accent} />
        <MetaBar>
          <DotScale value={difficulty} accent={accent} />
          {minRead > 0 && <MetaText text={`${minRead} min read`} />}
          {fcStr(fc, "era") !== "" && <MetaText text={fcStr(fc, "era")} faint />}
        </MetaBar>
      </>
    )
  }

  if (post.format === "academy") {
    const venueLine = [fcStr(fc, "authors_compact"), fcStr(fc, "venue")].filter(Boolean).join(" · ")
    return (
      <>
        {fcStr(fc, "field") !== "" && <LabelCaps text={fcStr(fc, "field")} color={accent} />}
        <Text style={titleStyle}>{fcStr(fc, "title") || post.title}</Text>
        {venueLine !== "" && (
          <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors["ink-muted"] }}>{venueLine}</Text>
        )}
        {fcStr(fc, "key_finding_one_line") !== "" && (
          <Text style={essenceStyle}>{fcStr(fc, "key_finding_one_line")}</Text>
        )}
        <Teasers items={teasersOf(fc)} accent={accent} />
        <MetaBar>
          <DotScale value={difficulty} accent={accent} />
          {minRead > 0 && <MetaText text={`${minRead} min read`} />}
          {fcNum(fc, "published_year") > 0 && <MetaText text={String(fcNum(fc, "published_year"))} />}
        </MetaBar>
      </>
    )
  }

  // Fallback for unknown formats
  return (
    <>
      <Text style={titleStyle}>{post.title}</Text>
      {fcStr(fc, "essence") !== "" && <Text style={essenceStyle}>{fcStr(fc, "essence")}</Text>}
    </>
  )
}

// One action rail entry: 44px tap target with the count below; the count is
// kept in layout but invisible at zero so icons don't shift (web .invisible).
function RailButton({
  onPress,
  icon,
  count,
  countColor,
  countVisible,
}: {
  onPress: () => void
  icon: React.ReactNode
  count?: number
  countColor?: string
  countVisible?: boolean
}) {
  return (
    <View style={{ alignItems: "center" }}>
      <Pressable
        onPress={onPress}
        hitSlop={4}
        style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
      >
        {icon}
      </Pressable>
      {count !== undefined && (
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 12,
            lineHeight: 13,
            color: countColor ?? colors["ink-dim"],
            opacity: countVisible ? 1 : 0,
          }}
        >
          {count}
        </Text>
      )}
    </View>
  )
}

function PostCard({ post, height }: { post: Post; height: number }) {
  const style = formatStyle(post.format)
  const router = useRouter()
  const { liked, likesCount, saved, like, toggleLike, toggleSave } = usePostActions(
    post.id,
    post.like_count
  )
  const [commentsCount, setCommentsCount] = useState(post.comment_count)
  const [showComments, setShowComments] = useState(false)
  // Saves are local-only (no backend endpoint yet), so the count can only
  // reflect this user's own save state.
  const saveCount = saved ? 1 : 0

  const lastTapRef = useRef(0)
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Web double-tap rule: a second tap within 300ms likes; otherwise navigate
  // after the window closes.
  function handleCardPress() {
    const now = Date.now()
    const elapsed = now - lastTapRef.current
    lastTapRef.current = now

    if (elapsed < 300) {
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current)
        navTimerRef.current = null
      }
      like()
      return
    }

    navTimerRef.current = setTimeout(() => {
      navTimerRef.current = null
      router.push(`/post/${post.id}`)
    }, 300)
  }

  return (
    <Pressable
      onPress={handleCardPress}
      style={{ height, backgroundColor: colors["surface-0"] }}
      className="px-5 pt-12 pb-8"
    >
      {/* Format indicator row with the web's badge glow */}
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: style.accent,
            boxShadow: `0 0 8px 3px ${style.accent}dd`,
          }}
        />
        <Text
          style={{
            fontFamily: fonts.sansSemiBold,
            fontSize: 11,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: style.accent,
            textShadowColor: style.accent,
            textShadowRadius: 8,
            textShadowOffset: { width: 0, height: 0 },
          }}
        >
          {style.badge}
        </Text>
      </View>

      {/* Card body — centered vertically like the web card */}
      <View className="flex-1 justify-center">
        <View
          style={{
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: colors.edge,
            borderLeftWidth: 2,
            borderLeftColor: style.accent,
            overflow: "hidden",
          }}
        >
          {/* The web .card 160deg surface gradient */}
          <LinearGradient
            colors={[colors["surface-1"], "#111111"]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={{ paddingHorizontal: 24, paddingVertical: 28, gap: 16 }}
          >
            <CardBody post={post} />
          </LinearGradient>

          {/* Author initial — bottom-right corner of the card box */}
          {post.author_username && (
            <View
              className="absolute items-center justify-center"
              style={{
                bottom: 12,
                right: 12,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors["surface-2"],
                borderWidth: 2,
                borderColor: colors["edge-strong"],
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.sansSemiBold,
                  fontSize: 14,
                  color: colors["ink-dim"],
                  textTransform: "uppercase",
                }}
              >
                {post.author_username[0]}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Interest tags — right inset keeps them clear of the action rail */}
      <View className="flex-row flex-wrap" style={{ gap: 8, paddingRight: 48 }}>
        {post.interests.map((name) => (
          <View
            key={name}
            style={{
              backgroundColor: colors["surface-2"],
              borderWidth: 1,
              borderColor: colors.edge,
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-dim"] }}>{name}</Text>
          </View>
        ))}
      </View>

      {/* Action rail — web PostCard right-edge icon column */}
      <View style={{ position: "absolute", right: 8, bottom: 88, alignItems: "center", gap: 4 }}>
        <RailButton
          onPress={toggleLike}
          icon={<HeartIcon size={24} color={liked ? colors.like : colors["ink-body"]} filled={liked} />}
          count={likesCount}
          countColor={liked ? colors.like : colors["ink-dim"]}
          countVisible={likesCount > 0 || liked}
        />
        <RailButton
          onPress={() => setShowComments(true)}
          icon={<CommentIcon size={24} color={colors["ink-body"]} />}
          count={commentsCount}
          countVisible={commentsCount > 0}
        />
        <RailButton
          onPress={toggleSave}
          icon={<BookmarkIcon size={24} color={saved ? colors.save : colors["ink-body"]} filled={saved} />}
          count={saveCount}
          countColor={saved ? colors.save : colors["ink-dim"]}
          countVisible={saveCount > 0 || saved}
        />
        <RailButton
          onPress={() => sharePost(post)}
          icon={<ShareIcon size={24} color={colors["ink-body"]} />}
        />
      </View>

      {showComments && (
        <CommentsBottomSheet
          postId={post.id}
          onClose={() => setShowComments(false)}
          onCountChange={setCommentsCount}
        />
      )}
    </Pressable>
  )
}

// memo: FlatList re-renders list items on scroll-state changes; post objects
// are stable per fetch, so a shallow check skips all off-screen work.
export default memo(PostCard)
