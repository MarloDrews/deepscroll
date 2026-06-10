import React from "react"

function WithCyanNumbers({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  const PATTERN = /(\d[\d,\.]*(?:\s*(?:billion|million|trillion|thousand))?)/gi
  let last = 0
  let match: RegExpExecArray | null
  while ((match = PATTERN.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    parts.push(<span key={match.index} className="text-(--accent)">{match[0]}</span>)
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

export default function HeadlineSection({ content }: { content: string }) {
  return (
    <div className="px-5 py-10 flex items-center justify-center min-h-[120px]">
      <p className="text-[2rem] font-bold text-ink leading-tight text-center max-w-xs">
        <WithCyanNumbers text={content} />
      </p>
    </div>
  )
}
