import SectionLabel from "../SectionLabel"
import Prose from "../Prose"

interface Props {
  content: string
}

export default function SetupSection({ content }: Props) {
  return (
    <div className="px-6 py-8">
      <SectionLabel className="mb-3">Setup</SectionLabel>
      <Prose className="text-ink-dim">{content}</Prose>
    </div>
  )
}
