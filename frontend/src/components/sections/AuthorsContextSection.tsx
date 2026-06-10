import SectionLabel from "../SectionLabel"
import type { AuthorsContextItem } from "../../types/post"

interface Props {
  content: AuthorsContextItem[]
}

export default function AuthorsContextSection({ content }: Props) {
  return (
    <div className="px-5 py-6 flex flex-col gap-4">
      <SectionLabel>{content.length === 1 ? "Author" : "Authors"}</SectionLabel>
      {content.map((author, i) => (
        <div key={i} className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-zinc-200">{author.name}</p>
          <p className="text-xs text-zinc-500">{author.role}</p>
          <p className="text-sm text-zinc-400 leading-snug">{author.one_line}</p>
          {author.affiliation && (
            <p className="text-xs text-zinc-600">{author.affiliation}</p>
          )}
        </div>
      ))}
    </div>
  )
}
