import SectionLabel from "../SectionLabel"
import type { OpenQuestionsContent } from "../../types/post"

interface Props {
  content: OpenQuestionsContent
}

// Prose section naming what is still unsettled about the fact: a body paragraph
// followed by a short list of specific open questions. Carries no visual.
export default function OpenQuestionsSection({ content }: Props) {
  return (
    <div className="px-6 py-8">
      <SectionLabel className="mb-3">Open Questions</SectionLabel>
      <p className="prose-post">{content.body}</p>
      {content.items && content.items.length > 0 && (
        <ul className="flex flex-col gap-3 mt-4">
          {content.items.map((line, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-(--accent) font-semibold text-sm mt-0.5 shrink-0">?</span>
              <span className="prose-post">{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
