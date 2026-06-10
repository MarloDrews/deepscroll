import SectionLabel from "../SectionLabel"

interface Props {
  content: string
}

export default function WhereTheDebateStandsSection({ content }: Props) {
  return (
    <div className="px-5 py-6">
      <SectionLabel className="mb-3">Where the Debate Stands</SectionLabel>
      <p className="text-sm text-ink-dim leading-relaxed">{content}</p>
    </div>
  )
}
