import { useState, type ReactNode } from "react"
import { Pressable, Text, View } from "react-native"
import { colors, fills, fonts, radius } from "../../theme/tokens"

// Port of the web stats CategorySection: each category floats as its own
// frosted slab with a caps label and a row of neutral chart-selector pills
// (active = filled, never accent). Two deliberate changes: charts are
// render thunks so only the selected chart is ever constructed, and the
// pill row wraps instead of scrolling horizontally — a horizontal
// scrollable inside the stats PagerView would fight the tab swipe.

export interface ChartOption {
  label: string
  render: () => ReactNode
}

export default function CategorySection({ title, charts }: { title: string; charts: ChartOption[] }) {
  const [selected, setSelected] = useState(0)
  const active = charts[selected] ?? charts[0]
  return (
    <View
      style={{
        marginHorizontal: 12,
        marginBottom: 12,
        backgroundColor: fills.slab,
        borderRadius: radius.slab,
        paddingHorizontal: 16,
        paddingVertical: 16,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.sansSemiBold,
          fontSize: 11,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: colors["ink-dim"],
          marginBottom: 12,
        }}
      >
        {title}
      </Text>
      {charts.length > 1 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {charts.map((c, i) => (
            <Pressable
              key={c.label}
              onPress={() => setSelected(i)}
              style={({ pressed }) => ({
                backgroundColor: selected === i ? fills.active12 : "transparent",
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 6,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <Text
                style={{
                  fontFamily: fonts.sansMedium,
                  fontSize: 13,
                  color: selected === i ? colors.ink : colors["ink-muted"],
                }}
              >
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <View>{active?.render()}</View>
    </View>
  )
}
