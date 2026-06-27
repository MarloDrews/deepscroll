import SectionLabel from "../SectionLabel"
import Prose from "../Prose"

interface Props {
  content: string
}

export default function WhereTheyClashSection({ content }: Props) {
  return (
    <div className="px-6 py-8">
      <SectionLabel className="mb-3">Where They Clash</SectionLabel>
      <Prose className="text-ink-dim">{content}</Prose>
    </div>
  )
}
