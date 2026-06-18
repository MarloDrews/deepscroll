// Editorial micro-label used as the header of every post section.
// LAYOUT_STANDARD section 7: identical on every section, in the format accent,
// preceded by a short accent tick (a small rule). The repeated tick is what makes
// the page read as one system; only the accent color differs per format. Size is
// never enlarged; the tick and accent carry the emphasis.
// data-no-read keeps labels out of read-aloud: only content is spoken.

interface Props {
  children: React.ReactNode
  className?: string
}

export default function SectionLabel({ children, className = "" }: Props) {
  return (
    <h3 data-no-read className={`label-caps text-(--accent) flex items-center gap-2 ${className}`}>
      <span aria-hidden className="h-px w-4 bg-(--accent) shrink-0" />
      {children}
    </h3>
  )
}
