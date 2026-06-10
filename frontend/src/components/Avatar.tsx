const API_URL = process.env.NEXT_PUBLIC_API_URL

interface Props {
  username: string
  avatarUrl?: string | null
  // diameter in px
  size: number
  className?: string
}

// Uploaded avatars live under the backend's /uploads/ mount.
function resolveUrl(url: string): string {
  return url.startsWith("/uploads/") ? `${API_URL}${url}` : url
}

export default function Avatar({ username, avatarUrl, size, className = "" }: Props) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolveUrl(avatarUrl)}
        alt={`@${username}`}
        width={size}
        height={size}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className={`rounded-full bg-zinc-700 flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <span
        className="text-white font-bold uppercase"
        style={{ fontSize: Math.max(12, Math.round(size * 0.4)) }}
      >
        {username.charAt(0)}
      </span>
    </div>
  )
}
