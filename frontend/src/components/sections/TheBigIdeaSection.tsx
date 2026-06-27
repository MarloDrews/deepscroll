import SectionLabel from "../SectionLabel"
import Prose from "../Prose"

interface Props {
  content: string
}

export default function TheBigIdeaSection({ content }: Props) {
  return (
    <div className="px-6 py-8">
      <SectionLabel className="mb-3">The Big Idea</SectionLabel>
      <Prose>{content}</Prose>
    </div>
  )
}
