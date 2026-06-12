import { useEffect } from "react"
import type { DesignId } from "@/lib/redesign"

// Mirrors the active design onto <body data-design="..."> so styles outside
// the page wrapper can scope to it: the body::before texture and portaled
// surfaces (sheets render into document.body). Effect-only mutation, so the
// server HTML never carries the attribute (no hydration mismatch).
export function useBodyDesign(design: DesignId | null) {
  useEffect(() => {
    if (design) document.body.dataset.design = design
    else delete document.body.dataset.design
    return () => {
      delete document.body.dataset.design
    }
  }, [design])
}
