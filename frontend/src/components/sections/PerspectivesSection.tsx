import SectionLabel from "../SectionLabel"
import SvgBlock from "../SvgBlock"
import type { PerspectiveItem } from "../../types/post"

interface Props {
  content: PerspectiveItem[]
  isUserContent: boolean
}

export default function PerspectivesSection({ content, isUserContent }: Props) {
  return (
    <div className="px-6 py-8 flex flex-col gap-10">
      <SectionLabel className="-mb-4">Perspectives</SectionLabel>
      {content.map((p, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div>
            <h3 className="text-base font-semibold text-(--accent) leading-snug">{p.position_name}</h3>
            {p.school_or_thinker && (
              <p className="text-xs text-ink-muted mt-0.5">{p.school_or_thinker}</p>
            )}
          </div>
          <p className="prose-post">{p.body}</p>
          <div className="border-l-2 border-(--accent)/40 pl-3 flex flex-col gap-2">
            {/* Readable secondary text, matching the quiz/sources kit treatment
                (text-sm + text-ink-dim + leading-relaxed): clearly below the
                position body but comfortably readable on the dark Stage. */}
            <p className="text-sm text-ink-dim leading-relaxed">
              <span className="font-semibold text-(--accent)">Strongest argument: </span>
              {p.strongest_argument}
            </p>
            {p.concrete_example && (
              <p className="text-sm text-ink-dim leading-relaxed">
                <span className="font-semibold text-ink-body">Example: </span>
                {p.concrete_example}
              </p>
            )}
          </div>
          {/* In-body diagram, rendered the same way facts/concepts render an
              inline visual_svg (SvgBlock handles the user/seed security split and
              the legacy accent re-palette; var(--accent) resolves from the page). */}
          {p.visual_svg && (
            <SvgBlock
              svg={p.visual_svg}
              isUserContent={isUserContent}
              className="w-full max-w-[400px] mx-auto mt-2"
            />
          )}
        </div>
      ))}
    </div>
  )
}
