import SectionLabel from "../SectionLabel"

interface Props {
  content: string
}

export default function HistoricalContextSection({ content }: Props) {
  return (
    <div className="px-5 py-6">
      <SectionLabel className="mb-3">Historical Context</SectionLabel>
      <p className="text-sm text-ink-dim leading-relaxed">{content}</p>
    </div>
  )
}
