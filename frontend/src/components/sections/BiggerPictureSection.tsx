interface Props {
  content: string
}

export default function BiggerPictureSection({ content }: Props) {
  return (
    <div className="px-5 py-6">
      <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-3">The Bigger Picture</p>
      <p className="text-base text-zinc-200 leading-relaxed font-medium">{content}</p>
    </div>
  )
}
