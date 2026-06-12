import { Text, View } from "react-native"
import type { CoreIdeaItem } from "../../types/post"
import { SectionBlock, Prose, SvgFigure, CaptionedImage } from "./primitives"
import { colors, fonts } from "../../theme/tokens"
import { useAccent } from "../../lib/accent"

// Port of frontend/src/components/sections/CoreIdeasSection.tsx
// Per idea: accent title, prose body, optional SVG/image/quote/in_practice
// callout. SVG security rule handled by SafeSvg via SvgFigure.
export default function CoreIdeasSection({
  content,
  isUserContent,
}: {
  content: CoreIdeaItem[]
  isUserContent: boolean
}) {
  const accent = useAccent()
  return (
    <SectionBlock gap={40}>
      {content.map((idea, i) => (
        <View key={i} style={{ gap: 12 }}>
          <Text style={{ fontFamily: fonts.serifMedium, fontSize: 19, lineHeight: 25, color: accent }}>
            {idea.title}
          </Text>
          <Prose>{idea.body}</Prose>

          {idea.visual_svg ? (
            <SvgFigure svg={idea.visual_svg} isUserContent={isUserContent} style={{ marginVertical: 16 }} />
          ) : null}

          {idea.image_url ? (
            <CaptionedImage url={idea.image_url} maxWidth={360} style={{ marginVertical: 8 }} />
          ) : null}

          {idea.quote ? (
            <View
              style={{
                borderLeftWidth: 2,
                borderLeftColor: colors["edge-strong"],
                paddingLeft: 16,
                marginVertical: 8,
              }}
            >
              <Text style={{ fontFamily: fonts.serifItalic, fontSize: 16, lineHeight: 26, color: colors["ink-dim"] }}>
                {"“"}{idea.quote}{"”"}
              </Text>
            </View>
          ) : null}

          {idea.in_practice ? (
            <View
              style={{
                backgroundColor: accent + "1a",
                borderWidth: 1,
                borderColor: accent + "4d",
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <Text style={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 22, color: colors.ink }}>
                {idea.in_practice}
              </Text>
            </View>
          ) : null}
        </View>
      ))}
    </SectionBlock>
  )
}
