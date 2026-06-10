import SectionLabel from "../SectionLabel"
import type { FieldContextContent } from "../../types/post"

interface Props {
  content: FieldContextContent
}

export default function FieldContextSection({ content }: Props) {
  return (
    <div className="px-5 py-6 flex flex-col gap-4">
      <SectionLabel>Field Context</SectionLabel>
      <p className="text-sm text-zinc-400 leading-relaxed">{content.body}</p>
      {content.key_priors.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-zinc-600">Key prior work</p>
          {content.key_priors.map((prior, i) => (
            <div key={i} className="border-l-2 border-zinc-700 pl-3 flex flex-col gap-0.5">
              <p className="text-xs text-zinc-500 font-medium">{prior.citation}</p>
              <p className="text-sm text-zinc-300 leading-snug">{prior.claim}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
