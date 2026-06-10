// Editorial micro-label used as the header of every post section.
// One style everywhere: tiny, uppercase, wide tracking, muted by default;
// a format accent color may be passed where the section calls for it.

interface Props {
  children: React.ReactNode
  color?: string
  className?: string
}

export default function SectionLabel({ children, color = "", className = "" }: Props) {
  return (
    <h3 className={`label-caps ${color} ${className}`}>
      {children}
    </h3>
  )
}
