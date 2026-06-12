import { SvgXml } from "react-native-svg"
import { Image } from "expo-image"
import { LEGACY_SVG_ACCENT_MAP } from "../lib/formats"
import { colors } from "../theme/tokens"

// Mobile counterpart of frontend/src/components/SvgBlock.tsx with the same
// security rule: seed/official SVGs (is_user_content=false, controlled
// pipeline) render inline via SvgXml; user submissions render as an <img>
// equivalent (expo-image with a data URI) where scripts cannot execute.
//
// Seed SVGs are re-paletted at render time: legacy accent hexes are mapped
// to the current Circuit format inks, and currentColor is given a concrete
// ink so strokes stay visible on the dark surface. Content JSON is never
// edited.

function rePalette(svg: string): string {
  let out = svg
  for (const [legacy, ink] of Object.entries(LEGACY_SVG_ACCENT_MAP)) {
    out = out.split(legacy).join(ink)
  }
  return out
}

interface SafeSvgProps {
  svg: string
  isUserContent: boolean
  width: number
  height: number
}

export default function SafeSvg({ svg, isUserContent, width, height }: SafeSvgProps) {
  if (isUserContent) {
    // encodeURIComponent keeps the data URI valid for non-ASCII SVG text
    // without needing a base64 polyfill (Hermes has no btoa).
    const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
    return <Image source={{ uri }} style={{ width, height }} contentFit="contain" />
  }
  return (
    <SvgXml
      xml={rePalette(svg)}
      width={width}
      height={height}
      color={colors["ink-body"]}
    />
  )
}
