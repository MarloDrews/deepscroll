"use client"

import { useRouter } from "next/navigation"
import { FORMAT_STYLES, type FormatId } from "@/lib/formats"

// Compact list card used wherever posts appear as rows (profile tabs etc.):
// format dot + badge + two-line title on a surface card.

interface Props {
  post: { id: number; format: string; title: string }
}

export default function PostRow({ post }: Props) {
  const router = useRouter()
  const style = FORMAT_STYLES[post.format as FormatId]
  return (
    <button
      onClick={() => router.push(`/post/${post.id}`)}
      className="w-full text-left card px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-surface-2 transition-colors duration-150"
    >
      <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${style?.dot ?? "bg-fmt-neutral"}`} />
      <div className="flex-1 min-w-0">
        {style && <span className={`label-caps ${style.text}`}>{style.badge}</span>}
        <p className="text-ink font-serif font-medium text-[15px] mt-0.5 line-clamp-2">{post.title}</p>
      </div>
    </button>
  )
}
