import { Text } from "react-native"
import type { StyleProp, TextStyle } from "react-native"
import { fonts } from "../theme/tokens"

// Port of frontend/src/components/MathText.tsx. The web renders $...$
// segments with KaTeX (HTML output); React Native has no HTML, so math
// segments render as monospace text with the delimiters stripped. This is a
// deliberate fidelity compromise for the academy/formalism sections.

type Segment = { type: "text"; content: string } | { type: "math"; content: string }

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = []
  let i = 0
  while (i < text.length) {
    const start = text.indexOf("$", i)
    if (start === -1) {
      if (i < text.length) segments.push({ type: "text", content: text.slice(i) })
      break
    }
    if (start > i) segments.push({ type: "text", content: text.slice(i, start) })
    const end = text.indexOf("$", start + 1)
    if (end === -1) {
      segments.push({ type: "text", content: text.slice(start) })
      break
    }
    segments.push({ type: "math", content: text.slice(start + 1, end) })
    i = end + 1
  }
  return segments
}

interface Props {
  text: string
  style?: StyleProp<TextStyle>
}

// Nested Text inherits the parent's style, so this can sit inside Prose.
export default function MathText({ text, style }: Props) {
  const segments = parseSegments(text)
  return (
    <Text style={style}>
      {segments.map((seg, i) =>
        seg.type === "text" ? (
          <Text key={i}>{seg.content}</Text>
        ) : (
          <Text key={i} style={{ fontFamily: fonts.mono }}>
            {seg.content}
          </Text>
        )
      )}
    </Text>
  )
}
