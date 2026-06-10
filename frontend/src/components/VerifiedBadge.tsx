// Verification badges: lamp-gold check for official Deepscroll content,
// slate-ink check for verified users (both from the Lamplight palette).
// One component so size and colors stay uniform.

interface Props {
  size?: number
  variant?: "user" | "official"
}

export default function VerifiedBadge({ size = 16, variant = "user" }: Props) {
  if (variant === "official") {
    return (
      <svg viewBox="0 0 16 16" width={size} height={size} className="shrink-0 text-lamp" fill="currentColor" aria-label="Official">
        <circle cx="8" cy="8" r="8" />
        <path d="M5 8.5l2 2 4-4" stroke="var(--color-surface-0)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none" aria-label="Verified" className="shrink-0 text-fmt-academy">
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="var(--color-surface-0)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
