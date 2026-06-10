import SectionLabel from "../SectionLabel"

interface Props {
  content: string
}

export default function TheBigIdeaSection({ content }: Props) {
  return (
    <div className="px-5 py-6">
      <SectionLabel className="mb-3">The Big Idea</SectionLabel>
      <p className="text-sm text-ink-body leading-relaxed">{content}</p>
    </div>
  )
}
