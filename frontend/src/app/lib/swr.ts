import { mutate } from "swr"
import { apiFetch } from "./api"

// Error type for non-2xx responses so callers can branch on status
// (e.g. 404 -> "Profile not found") the same way they did with res.ok.
export class ApiError extends Error {
  status: number
  constructor(status: number) {
    super(`API error ${status}`)
    this.status = status
  }
}

// Shared SWR fetcher: same auth behavior as direct apiFetch calls
// (Authorization header attached when a token is in localStorage).
export async function jsonFetcher<T>(path: string): Promise<T> {
  const r = await apiFetch(path)
  if (!r.ok) throw new ApiError(r.status)
  return r.json() as Promise<T>
}

// Clear every cached key. Called on login/register/logout so a different
// account can never see the previous account's cached /api/feed/following,
// /api/stats/me or /api/chat/conversations data. Public data simply refetches.
export function clearApiCache(): void {
  mutate(() => true, undefined, { revalidate: false })
}
