interface PortraitContent {
  image_url: string
  image_caption?: string
  image_attribution?: string
}

interface Props {
  content: PortraitContent
}

export default function PortraitSection({ content }: Props) {
  return (
    <div className="flex flex-col">
      <img
        src={content.image_url}
        alt=""
        loading="lazy"
        className="w-full object-cover max-h-[420px]"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
      />
      {content.image_caption && (
        <div className="px-5 pt-3 pb-2">
          <p className="text-sm text-ink-dim leading-snug">{content.image_caption}</p>
          {content.image_attribution && (
            <p className="text-xs text-ink-faint mt-1">{content.image_attribution}</p>
          )}
        </div>
      )}
    </div>
  )
}
