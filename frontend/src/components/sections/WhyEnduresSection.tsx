interface Props {
  content: string
}

export default function WhyEnduresSection({ content }: Props) {
  return (
    <div className="px-5 py-6">
      <div className="border-l-2 border-(--accent) pl-4">
        <p className="text-base text-ink-body leading-relaxed">{content}</p>
      </div>
    </div>
  )
}
