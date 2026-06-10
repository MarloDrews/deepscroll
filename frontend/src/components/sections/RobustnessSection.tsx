import SectionLabel from "../SectionLabel"

interface Props {
  content: string
}

export default function RobustnessSection({ content }: Props) {
  return (
    <div className="px-5 py-6">
      <SectionLabel className="mb-3">Robustness</SectionLabel>
      <p className="text-sm text-ink-dim leading-relaxed">{content}</p>
    </div>
  )
}
