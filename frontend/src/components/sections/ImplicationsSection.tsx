import SectionLabel from "../SectionLabel"

interface Props {
  content: string
}

export default function ImplicationsSection({ content }: Props) {
  return (
    <div className="px-5 py-6">
      <SectionLabel className="mb-3">Implications</SectionLabel>
      <p className="text-sm text-ink-dim leading-relaxed">{content}</p>
    </div>
  )
}
