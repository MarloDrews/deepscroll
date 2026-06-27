import SectionLabel from "../SectionLabel"
import Prose from "../Prose"

interface Props {
  content: string
}

export default function WhatHangsOnItSection({ content }: Props) {
  return (
    <div className="px-6 py-8">
      <SectionLabel className="mb-3">What Hangs On It</SectionLabel>
      <Prose className="text-ink-dim">{content}</Prose>
    </div>
  )
}
