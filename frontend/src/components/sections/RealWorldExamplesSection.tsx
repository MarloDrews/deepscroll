import SectionLabel from "../SectionLabel"
import SvgBlock from "../SvgBlock"
import ContentImage from "./ContentImage"

interface Example {
  title: string
  domain: string
  body: string
  image_url?: string
  image_caption?: string
  image_attribution?: string
  visual_svg?: string
}

interface Props {
  content: Example[]
  isUserContent: boolean
}

export default function RealWorldExamplesSection({ content, isUserContent }: Props) {
  return (
    <div className="px-6 py-8 flex flex-col gap-8">
      <SectionLabel className="-mb-4">Real-World Examples</SectionLabel>
      {content.map((example, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div>
            <h3 className="text-sm font-semibold text-ink leading-snug">{example.title}</h3>
            <p className="text-xs text-(--accent)/80 font-semibold tracking-widest uppercase mt-0.5">{example.domain}</p>
          </div>
          <p className="prose-post text-ink-dim">{example.body}</p>
          {example.image_url && (
            <ContentImage
              url={example.image_url}
              caption={example.image_caption}
              attribution={example.image_attribution}
              className="w-full max-w-[360px] mx-auto mt-2"
            />
          )}
          {example.visual_svg && (
            <SvgBlock
              svg={example.visual_svg}
              isUserContent={isUserContent}
              className="w-full max-w-[360px] mx-auto mt-2"
            />
          )}
        </div>
      ))}
    </div>
  )
}
