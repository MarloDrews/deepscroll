import type { MisconceptionItem } from "../../types/post"

interface Props {
  content: MisconceptionItem[]
}

export default function MisconceptionsSection({ content }: Props) {
  return (
    <div className="px-5 py-6">
      <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-4">Common Misconceptions</p>
      <div className="flex flex-col gap-4">
        {content.map((item, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <span className="text-red-500 text-xs mt-0.5 shrink-0 font-bold">✕</span>
              <span className="text-sm text-zinc-500 line-through leading-relaxed">{item.myth}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 text-xs mt-0.5 shrink-0 font-bold">✓</span>
              <span className="text-sm text-zinc-300 leading-relaxed">{item.reality}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
