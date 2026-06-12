import { createContext, useContext } from "react"
import { colors } from "../theme/tokens"

// React Native has no CSS custom properties. This context plays the role of
// the web's per-post --accent variable: the detail screen wraps its content
// in <AccentProvider value={formatStyle(post.format).accent}> and every
// section component reads the current accent with useAccent().
const AccentContext = createContext<string>(colors["fmt-neutral"])

export const AccentProvider = AccentContext.Provider

export function useAccent(): string {
  return useContext(AccentContext)
}
