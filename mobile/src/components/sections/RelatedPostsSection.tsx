import { Pressable, ScrollView, Text, View } from "react-native"
import { useRouter } from "expo-router"
import type { ReadNextItem } from "../../types/post"
import { SECTION_PADDING_H, SECTION_PADDING_V, sans, sansSemiBold } from "./primitives"
import { colors, radius } from "../../theme/tokens"

// Port of frontend/src/components/sections/RelatedPostsSection.tsx
// Renders server-resolved read_next edges. Resolved (live target) cards are
// clickable; latent ones (target_post_id null) are dimmed "Coming soon".

const FORMAT_LABELS: Record<string, string> = {
  books: "Book",
  facts: "Fact",
  people: "Person",
  concepts: "Idea",
  questions: "Q&A",
  stories: "Story",
  academy: "Academy",
}

function RelatedCard({ item }: { item: ReadNextItem }) {
  const router = useRouter()
  // Resolved (live target) entries are clickable; latent ones (target_post_id
  // null) stay non-clickable with the "Coming soon" treatment.
  const hasLink = item.target_post_id != null
  const label = FORMAT_LABELS[item.format] ?? item.format

  const inner = (
    <View
      style={{
        gap: 6,
        padding: 16,
        borderWidth: 1,
        borderColor: colors["edge-strong"],
        borderRadius: radius.card,
        width: 180,
        minHeight: 110,
      }}
    >
      <Text style={sans(12, colors["ink-muted"], { textTransform: "uppercase", letterSpacing: 0.5 })}>
        {label}
      </Text>
      <Text numberOfLines={2} style={sansSemiBold(14, colors.ink, { lineHeight: 19 })}>
        {item.title}
      </Text>
    </View>
  )

  if (hasLink) {
    return <Pressable onPress={() => router.push(`/post/${item.target_post_id}`)}>{inner}</Pressable>
  }

  return (
    <View style={{ opacity: 0.6 }}>
      {inner}
      <Text style={[sans(12, colors["ink-faint"]), { position: "absolute", bottom: 8, right: 12 }]}>
        Coming soon
      </Text>
    </View>
  )
}

export default function RelatedPostsSection({ content }: { content: ReadNextItem[] }) {
  return (
    <View style={{ paddingVertical: SECTION_PADDING_V }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingHorizontal: SECTION_PADDING_H }}
      >
        {content.map((item, i) => (
          <RelatedCard key={i} item={item} />
        ))}
      </ScrollView>
    </View>
  )
}
