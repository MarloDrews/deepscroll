import SectionLabel from "../SectionLabel"

interface Props {
  content: string
}

export default function WhyItsHardSection({ content }: Props) {
  return (
    <div className="px-5 py-6">
      <SectionLabel className="mb-3">Why It&apos;s Hard</SectionLabel>
      <p className="text-sm text-ink-dim leading-relaxed">{content}</p>
    </div>
  )
}
