import SectionLabel from "../SectionLabel"
interface Props {
  content: string
}

export default function WorldContextSection({ content }: Props) {
  return (
    <div className="px-5 py-6">
      <SectionLabel className="mb-3">The World It Came From</SectionLabel>
      <p className="text-sm text-ink-dim leading-relaxed">{content}</p>
    </div>
  )
}
