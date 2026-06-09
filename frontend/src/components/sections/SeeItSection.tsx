import type { SeeItContent } from "../../types/post"

interface Props {
  content: SeeItContent
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

export default function SeeItSection({ content, isUserContent }: Props) {
  return (
    <div className="px-5 py-6 flex flex-col gap-3">
      <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">See It</p>
      {content.visual_svg && (
        <div className="w-full max-w-[360px] mx-auto bg-transparent">
          <SvgBlock svg={content.visual_svg} isUserContent={isUserContent} />
        </div>
      )}
      {content.image_url && !content.visual_svg && (
        <div className="w-full max-w-[360px] mx-auto">
          <img src={content.image_url} alt="" className="w-full rounded-lg object-cover" />
        </div>
      )}
      {content.image_caption && (
        <p className="text-xs text-zinc-500 text-center leading-relaxed">{content.image_caption}</p>
      )}
      {content.image_attribution && (
        <p className="text-[10px] text-zinc-600 text-center">{content.image_attribution}</p>
      )}
    </div>
  )
}
