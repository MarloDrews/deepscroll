import { Pressable, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { FORMAT_STYLES, type FormatId } from "../lib/formats"
import { colors, fills, fonts, radius } from "../theme/tokens"

// Port of frontend/src/components/PostRow.tsx: compact post list slab used
// wherever posts appear as rows (profile tabs etc.) — format dot + caps badge
// + two-line serif title; press brightens the fill like the web hover.

interface Props {
  post: { id: number; format: string; title: string }
}

export default function PostRow({ post }: Props) {
  const router = useRouter()
  const style = FORMAT_STYLES[post.format as FormatId]
  return (
    <Pressable
      onPress={() => router.push(`/post/${post.id}`)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? "rgba(255, 255, 255, 0.07)" : fills.slab,
        borderRadius: radius.card,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
      })}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          marginTop: 8,
          backgroundColor: style?.accent ?? colors["fmt-neutral"],
        }}
      />
      <View style={{ flex: 1 }}>
        {style && (
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
        )}
        <Text
          numberOfLines={2}
          style={{
            fontFamily: fonts.serifMedium,
            fontSize: 15,
            lineHeight: 20,
            color: colors.ink,
            marginTop: 2,
          }}
        >
          {post.title}
        </Text>
      </View>
    </Pressable>
  )
}
