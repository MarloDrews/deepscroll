import type { AngleItem } from "../../types/post"

interface Props {
  content: AngleItem[]
  isUserContent: boolean
}

function SvgBlock({ svg, isUserContent }: { svg: string; isUserContent: boolean }) {
  if (isUserContent) {
    return <img src={`data:image/svg+xml;base64,${btoa(svg)}`} alt="" className="w-full" />
  }
  return (
    <div
      className="w-full"
      style={{ color: "#e4e4e7" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export default function AnglesSection({ content, isUserContent }: Props) {
  return (
    <div className="px-5 py-6 flex flex-col gap-8">
      <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">Multiple Angles</p>
      {content.map((angle, i) => (
        <div key={i} className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-cyan-400 leading-snug">{angle.title}</h3>
          <p className="text-sm text-zinc-300 leading-relaxed">{angle.body}</p>
          {angle.visual_svg && (
            <div className="w-full max-w-[360px] mx-auto bg-transparent mt-2">
              <SvgBlock svg={angle.visual_svg} isUserContent={isUserContent} />
            </div>
          )}
          {angle.image_url && !angle.visual_svg && (
            <div className="w-full max-w-[360px] mx-auto mt-2">
              <img src={angle.image_url} alt="" className="w-full rounded-lg object-cover" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
