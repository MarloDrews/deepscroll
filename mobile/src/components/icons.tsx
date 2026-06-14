import Svg, { Path } from "react-native-svg"

// Stage glyph set, path data copied verbatim from the web
// frontend/src/app/components/icons.tsx: soft rounded outline forms at
// strokeWidth 1.8; closed shapes (heart, bookmark) become solid via the
// filled prop. SendIcon is the share paper plane; ArrowUpIcon is the comment
// submit arrow (deliberately distinct).

interface IconProps {
  size?: number
  color: string
  filled?: boolean
}

function StrokedPath({ d, color, filled }: { d: string; color: string; filled?: boolean }) {
  return (
    <Path
      d={d}
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth={filled ? 0 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

export function HeartIcon({ size = 24, color, filled }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <StrokedPath
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
        color={color}
        filled={filled}
      />
    </Svg>
  )
}

export function CommentIcon({ size = 24, color, filled }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <StrokedPath
        d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z"
        color={color}
        filled={filled}
      />
    </Svg>
  )
}

export function BookmarkIcon({ size = 24, color, filled }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <StrokedPath
        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
        color={color}
        filled={filled}
      />
    </Svg>
  )
}

// Share — the paper plane (web SendIcon); the feed rail's last action.
export function ShareIcon({ size = 24, color }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <StrokedPath
        d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
        color={color}
      />
    </Svg>
  )
}

// Comment submit — an upward arrow inside the circular send button.
export function ArrowUpIcon({ size = 24, color }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path
        d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// Read-aloud placeholder on the post marker row (disabled, no handler yet).
export function SpeakerIcon({ size = 24, color }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <StrokedPath
        d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
        color={color}
      />
    </Svg>
  )
}

// Streak flame — soft outline fire (heroicons fire), solid via the filled prop.
export function FlameIcon({ size = 24, color, filled }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <StrokedPath
        d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.048 8.287 8.287 0 0 0 9 9.6a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Zm-5.013 7.74a3.75 3.75 0 0 0 5.272 5.117 5.99 5.99 0 0 0-1.925-3.546 5.974 5.974 0 0 1-2.133-1.001 5.99 5.99 0 0 0-1.214 4.43Z"
        color={color}
        filled={filled}
      />
    </Svg>
  )
}

export function BackIcon({ size = 24, color }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path
        d="M15 18l-6-6 6-6"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
