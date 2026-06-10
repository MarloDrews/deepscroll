import SectionLabel from "../SectionLabel"
import MathText from "../MathText"

interface Props {
  content: string
}

export default function TldrSection({ content }: Props) {
  return (
    <div className="px-5 py-6">
      <SectionLabel className="mb-3">TL;DR</SectionLabel>
      <p className="text-sm text-ink-body leading-relaxed">
        <MathText text={content} />
      </p>
    </div>
  )
}
