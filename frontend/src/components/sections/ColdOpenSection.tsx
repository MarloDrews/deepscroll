interface Props {
  content: string
}

export default function ColdOpenSection({ content }: Props) {
  return (
    <div className="px-5 py-6">
      <p className="text-base text-ink leading-relaxed font-medium">{content}</p>
    </div>
  )
}
