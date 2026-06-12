import AsyncStorage from "@react-native-async-storage/async-storage"

// Port of frontend/src/app/lib/likedPosts.ts: same keys and meanings, but
// AsyncStorage is promise-based so every function is async. The web-only
// migrateSentKey legacy migration is dropped (no shipped mobile users).
// TODO: replace with a backend endpoint once likes are server-side.
const LIKED_KEY = "deepscroll_liked"
const COUNTS_KEY = "deepscroll_like_counts"
const SENT_KEY = "deepscroll_like_sent"

async function readIds(key: string): Promise<number[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(key)) ?? "[]") as number[]
  } catch {
    return []
  }
}

export async function getLikedPostIds(): Promise<number[]> {
  return readIds(LIKED_KEY)
}

export async function likePost(id: number): Promise<void> {
  const ids = await getLikedPostIds()
  if (!ids.includes(id)) await AsyncStorage.setItem(LIKED_KEY, JSON.stringify([...ids, id]))
}

export async function unlikePost(id: number): Promise<void> {
  const ids = await getLikedPostIds()
  await AsyncStorage.setItem(LIKED_KEY, JSON.stringify(ids.filter((x) => x !== id)))
}

export async function isPostLiked(id: number): Promise<boolean> {
  return (await getLikedPostIds()).includes(id)
}

export async function getCachedLikeCount(id: number): Promise<number | null> {
  try {
    const obj = JSON.parse((await AsyncStorage.getItem(COUNTS_KEY)) ?? "{}") as Record<
      string,
      number
    >
    const val = obj[String(id)]
    return val !== undefined ? val : null
  } catch {
    return null
  }
}

export async function setCachedLikeCount(id: number, count: number): Promise<void> {
  try {
    const obj = JSON.parse((await AsyncStorage.getItem(COUNTS_KEY)) ?? "{}") as Record<
      string,
      number
    >
    obj[String(id)] = count
    await AsyncStorage.setItem(COUNTS_KEY, JSON.stringify(obj))
  } catch {}
}

// Whether a "like" event for this post was ever queued and sent to the backend.
export async function isLikeSent(id: number): Promise<boolean> {
  return (await readIds(SENT_KEY)).includes(id)
}

export async function markLikeSent(id: number): Promise<void> {
  const ids = await readIds(SENT_KEY)
  if (!ids.includes(id)) await AsyncStorage.setItem(SENT_KEY, JSON.stringify([...ids, id]))
}

// Called when the user unlikes before the event has left the in-memory queue.
export async function unmarkLikeSent(id: number): Promise<void> {
  const ids = await readIds(SENT_KEY)
  await AsyncStorage.setItem(SENT_KEY, JSON.stringify(ids.filter((x) => x !== id)))
}
