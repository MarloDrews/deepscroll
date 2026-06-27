import SectionLabel from "../SectionLabel"
import MathText from "../MathText"
import Prose from "../Prose"

interface Props {
  content: string
}

export default function TldrSection({ content }: Props) {
  return (
    <div className="px-6 py-8">
      <SectionLabel className="mb-3">TL;DR</SectionLabel>
      <Prose>
        <MathText text={content} />
      </Prose>
    </div>
  )
}
