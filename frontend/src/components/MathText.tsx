import katex from "katex"

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
  className?: string
}

// Renders prose text that may contain inline $...$ LaTeX math.
export default function MathText({ text, className }: Props) {
  const segments = parseSegments(text)

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === "text") return <span key={i}>{seg.content}</span>
        const html = (() => {
          try {
            return katex.renderToString(seg.content, { throwOnError: false, output: "html" })
          } catch {
            return seg.content
          }
        })()
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
      })}
    </span>
  )
}
