interface Props {
  content: string
}

export default function SurprisesSection({ content }: Props) {
  return (
    <div className="px-5 py-6 bg-cyan-950/20">
      <p className="text-xs font-semibold tracking-widest text-cyan-600 uppercase mb-3">Why It Surprises Us</p>
      <p className="text-base text-zinc-200 leading-relaxed">{content}</p>
    </div>
  )
}
