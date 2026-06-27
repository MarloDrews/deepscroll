import SectionLabel from "../SectionLabel"
import Prose from "../Prose"
interface Props {
  content: string
}

export default function BiggerPictureSection({ content }: Props) {
  return (
    <div className="px-6 py-8">
      <SectionLabel className="mb-3">The Bigger Picture</SectionLabel>
      <Prose className="text-ink font-medium">{content}</Prose>
    </div>
  )
}
