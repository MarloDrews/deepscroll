import { Linking, Pressable, Text, View } from "react-native"
import type { PaperCardContent } from "../../types/post"
import { SectionBlock, sans, sansSemiBold } from "./primitives"
import { colors, radius } from "../../theme/tokens"
import { useAccent } from "../../lib/accent"

// Port of frontend/src/components/sections/PaperCardSection.tsx
// Paper metadata card: title, authors + affiliations, venue/year/funding, DOI link.
export default function PaperCardSection({ content }: { content: PaperCardContent }) {
  const accent = useAccent()
  return (
    <SectionBlock>
      <View
        style={{
          borderWidth: 1,
          borderColor: colors["edge-strong"],
          borderRadius: radius.card,
          paddingHorizontal: 16,
          paddingVertical: 16,
          gap: 12,
        }}
      >
        <Text style={sansSemiBold(14, colors.ink, { lineHeight: 19 })}>{content.title}</Text>
        <View style={{ gap: 4 }}>
          {content.authors.map((a, i) => (
            <Text key={i} style={sans(12, colors["ink-body"])}>
              {a.name}
              {a.affiliation ? <Text style={sans(12, colors["ink-muted"])}> · {a.affiliation}</Text> : null}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 12, rowGap: 4 }}>
          <Text style={sans(12, colors["ink-muted"])}>{content.venue}</Text>
          <Text style={sans(12, colors["ink-muted"])}>{content.year}</Text>
          {content.funding_source ? (
            <Text style={sans(12, colors["ink-muted"])}>{content.funding_source}</Text>
          ) : null}
        </View>
        {content.doi ? (
          <Pressable onPress={() => Linking.openURL(content.doi!).catch(() => {})}>
            <Text style={sans(12, accent)}>{content.doi}</Text>
          </Pressable>
        ) : null}
      </View>
    </SectionBlock>
  )
}
