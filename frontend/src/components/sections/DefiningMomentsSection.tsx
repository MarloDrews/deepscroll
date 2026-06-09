interface Episode {
  title: string
  year_or_period: string
  body: string
  image_url?: string
  image_caption?: string
  image_attribution?: string
  visual_svg?: string
  location?: string
}

interface Props {
  content: Episode[]
  isUserContent: boolean
}

function SvgBlock({ svg, isUserContent }: { svg: string; isUserContent: boolean }) {
  if (isUserContent) {
    return (
      <div className="w-full max-w-[400px] mx-auto my-3">
        <img src={`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`} alt="" className="w-full" />
      </div>
    )
  }
  return (
    <div
      className="w-full max-w-[400px] mx-auto my-3"
      style={{ color: "#e4e4e7" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export default function DefiningMomentsSection({ content, isUserContent }: Props) {
  return (
    <div className="px-5 py-6 flex flex-col gap-10">
      <h3 className="text-xs text-zinc-500 uppercase tracking-wide -mb-4">Defining Moments</h3>
      {content.map((episode, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xs font-mono text-rose-400 shrink-0">{episode.year_or_period}</span>
            {episode.location && (
              <span className="text-xs text-zinc-600">{episode.location}</span>
            )}
          </div>
          <h4 className="text-lg font-semibold text-zinc-100 leading-snug">{episode.title}</h4>
          <p className="text-base text-zinc-300 leading-relaxed">{episode.body}</p>

          {episode.visual_svg && episode.visual_svg.length > 0 && (
            <SvgBlock svg={episode.visual_svg} isUserContent={isUserContent} />
          )}

          {episode.image_url && (
            <div className="flex flex-col">
              <img
                src={episode.image_url}
                alt=""
                loading="lazy"
                className="w-full rounded-lg object-cover max-h-[280px]"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
              />
              {episode.image_caption && (
                <p className="text-xs text-zinc-500 mt-2 leading-snug">{episode.image_caption}</p>
              )}
              {episode.image_attribution && (
                <p className="text-xs text-zinc-700 mt-0.5">{episode.image_attribution}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
