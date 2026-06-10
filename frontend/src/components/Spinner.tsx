// Unified loading spinner.

interface Props {
  size?: "sm" | "md"
}

export default function Spinner({ size = "md" }: Props) {
  const dims = size === "sm" ? "w-5 h-5" : "w-6 h-6"
  return <div className={`${dims} border-2 border-edge-strong border-t-ink rounded-full animate-spin`} />
}
