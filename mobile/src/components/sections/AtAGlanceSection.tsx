import type { ReactNode } from "react"
import { Text, View } from "react-native"
import type {
  AtAGlanceBooksContent,
  AtAGlancePeopleContent,
  AtAGlanceQuestionsContent,
  AtAGlanceStoriesContent,
  AtAGlanceAcademyContent,
} from "../../types/post"
import { SectionBlock, sans } from "./primitives"
import { colors, fonts } from "../../theme/tokens"
import { useAccent } from "../../lib/accent"

// Port of frontend/src/components/sections/AtAGlanceSection.tsx
// Two-column fact grid; the variant is detected from marker fields exactly
// like on the web (study_type -> academy, born -> people, ...).

type AnyAtAGlance =
  | AtAGlanceBooksContent
  | AtAGlancePeopleContent
  | AtAGlanceQuestionsContent
  | AtAGlanceStoriesContent
  | AtAGlanceAcademyContent

function DotScale({ value, max = 3 }: { value: number; max?: number }) {
  const accent = useAccent()
  return (
    <View style={{ flexDirection: "row", gap: 3, paddingTop: 5 }}>
      {Array.from({ length: max }, (_, i) => (
        <View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i < value ? accent : colors["surface-3"],
          }}
        />
      ))}
    </View>
  )
}

interface Row {
  label: string
  value: ReactNode
}

function FactGrid({ rows }: { rows: Row[] }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 12 }}>
      {rows.map(({ label, value }) => (
        <View key={label} style={{ width: "50%", gap: 2, paddingRight: 12 }}>
          <Text style={sans(12, colors["ink-muted"], { textTransform: "uppercase", letterSpacing: 0.5 })}>
            {label}
          </Text>
          {typeof value === "string" || typeof value === "number" ? (
            <Text style={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.ink }}>
              {value}
            </Text>
          ) : (
            value
          )}
        </View>
      ))}
    </View>
  )
}

function FooterRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        gap: 2,
        paddingTop: 12,
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.edge,
      }}
    >
      <Text style={sans(12, colors["ink-muted"], { textTransform: "uppercase", letterSpacing: 0.5 })}>
        {label}
      </Text>
      <Text style={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.ink }}>
        {value}
      </Text>
    </View>
  )
}

function isAcademy(c: AnyAtAGlance): c is AtAGlanceAcademyContent {
  return "study_type" in c
}
function isPeople(c: AnyAtAGlance): c is AtAGlancePeopleContent {
  return "born" in c
}
function isQuestions(c: AnyAtAGlance): c is AtAGlanceQuestionsContent {
  return "still_debated" in c
}
function isStories(c: AnyAtAGlance): c is AtAGlanceStoriesContent {
  return "sources_reliability" in c
}

export default function AtAGlanceSection({ content }: { content: AnyAtAGlance }) {
  if (isAcademy(content)) {
    const rows: Row[] = [
      { label: "Study type", value: content.study_type },
      { label: "Peer review", value: content.peer_review_status },
      { label: "Result direction", value: content.result_direction },
      { label: "Replication", value: content.replication_status },
      { label: "Pre-registered", value: content.pre_registered ? "Yes" : "No" },
      { label: "Open data", value: content.open_data ? "Yes" : "No" },
      { label: "Open code", value: content.open_code ? "Yes" : "No" },
      { label: "Read time", value: `${content.post_reading_time_min} min` },
      { label: "Difficulty", value: <DotScale value={content.post_difficulty} /> },
    ]
    return (
      <SectionBlock>
        <FactGrid rows={rows} />
      </SectionBlock>
    )
  }

  if (isQuestions(content)) {
    const rows: Row[] = [
      { label: "Field", value: content.field },
      { label: "Type", value: content.type },
      { label: "First posed by", value: content.first_posed_by },
      { label: "Key year", value: String(content.year) },
      { label: "Still debated", value: content.still_debated ? "Yes" : "No" },
      { label: "Read time", value: `${content.post_reading_time_min} min` },
      { label: "Difficulty", value: <DotScale value={content.post_difficulty} /> },
    ]
    return (
      <SectionBlock>
        <FactGrid rows={rows} />
      </SectionBlock>
    )
  }

  if (isStories(content)) {
    const rows: Row[] = [
      { label: "Era", value: content.era },
      { label: "Location", value: content.location },
      { label: "Category", value: content.category },
      { label: "Source reliability", value: <DotScale value={content.sources_reliability} /> },
      { label: "Read time", value: `${content.post_reading_time_min} min` },
      { label: "Difficulty", value: <DotScale value={content.post_difficulty} /> },
    ]
    return (
      <SectionBlock>
        <FactGrid rows={rows} />
      </SectionBlock>
    )
  }

  if (isPeople(content)) {
    const rows: Row[] = [
      { label: "Born", value: content.born },
      ...(content.died ? [{ label: "Died", value: content.died }] : []),
      { label: "Nationality", value: content.nationality },
      { label: "Field", value: content.field },
      { label: "Read time", value: `${content.post_reading_time_min} min` },
      { label: "Difficulty", value: <DotScale value={content.post_difficulty} /> },
    ]
    return (
      <SectionBlock>
        <FactGrid rows={rows} />
        <FooterRow label="Known for" value={content.known_for} />
      </SectionBlock>
    )
  }

  const rows: Row[] = [
    { label: "Genre", value: content.genre },
    { label: "Year", value: content.year },
    { label: "Country", value: content.country },
    { label: "Pages", value: content.pages },
    { label: "Reading ease", value: <DotScale value={content.reading_ease} /> },
    { label: "Read time", value: `${content.post_reading_time_min} min` },
    { label: "Difficulty", value: <DotScale value={content.post_difficulty} /> },
  ]
  return (
    <SectionBlock>
      <FactGrid rows={rows} />
      <FooterRow label="Best for" value={content.best_for} />
    </SectionBlock>
  )
}
