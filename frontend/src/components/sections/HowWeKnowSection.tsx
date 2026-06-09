interface Props {
  content: string
}

export default function HowWeKnowSection({ content }: Props) {
  return (
    <div className="px-5 py-6">
      <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-3">How We Know</p>
      <p className="text-base text-zinc-300 leading-relaxed">{content}</p>
    </div>
  )
}
