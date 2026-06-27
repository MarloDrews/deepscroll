import SectionLabel from "../SectionLabel"
import Prose from "../Prose"
interface Props {
  content: string
}

export default function HowWeKnowSection({ content }: Props) {
  return (
    <div className="px-6 py-8">
      <SectionLabel className="mb-3">How We Know</SectionLabel>
      <Prose>{content}</Prose>
    </div>
  )
}
