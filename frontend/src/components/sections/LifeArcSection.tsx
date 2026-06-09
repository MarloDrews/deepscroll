interface Milestone {
  year: string
  label: string
}

interface LifeArcContent {
  visual_svg: string
  milestones: Milestone[]
}

interface Props {
  content: LifeArcContent
  isUserContent: boolean
}

function SvgBlock({ svg, isUserContent }: { svg: string; isUserContent: boolean }) {
  if (isUserContent) {
    return (
      <div className="w-full max-w-[400px] mx-auto my-2">
        <img src={`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`} alt="" className="w-full" />
      </div>
    )
  }
  return (
    <div
      className="w-full max-w-[400px] mx-auto my-2"
      style={{ color: "#e4e4e7" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export default function LifeArcSection({ content, isUserContent }: Props) {
  return (
    <div className="px-5 py-6">
      <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-4">Life Arc</h3>
      {content.visual_svg && (
        <SvgBlock svg={content.visual_svg} isUserContent={isUserContent} />
      )}
      <ol className="mt-4 flex flex-col gap-2">
        {content.milestones.map((m, i) => (
          <li key={i} className="flex gap-3 items-baseline">
            <span className="text-xs font-mono text-rose-400 shrink-0 w-10">{m.year}</span>
            <span className="text-sm text-zinc-400">{m.label}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
