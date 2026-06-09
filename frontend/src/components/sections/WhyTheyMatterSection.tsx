interface Props {
  content: string
}

export default function WhyTheyMatterSection({ content }: Props) {
  return (
    <div className="px-5 py-6">
      <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Why They Matter</h3>
      <p className="text-base text-zinc-300 leading-relaxed">{content}</p>
    </div>
  )
}
