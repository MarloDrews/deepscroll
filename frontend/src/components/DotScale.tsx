// Difficulty as three neutral dots; the per-format accent stays on the
// format marker and the teaser bullets only. Shared by the feed card footer
// and the post detail meta row so both render the identical scale.
export default function DotScale({ value }: { value: 1 | 2 | 3 }) {
  return (
    <span className="flex gap-1" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`inline-block w-1 h-1 rounded-full ${i <= value ? "bg-ink-dim" : "bg-white/15"}`}
        />
      ))}
    </span>
  )
}
