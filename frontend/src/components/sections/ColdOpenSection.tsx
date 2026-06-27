import Prose from "../Prose"

interface Props {
  content: string
}

export default function ColdOpenSection({ content }: Props) {
  return (
    <div className="px-6 py-8">
      <Prose className="text-ink font-medium">{content}</Prose>
    </div>
  )
}
