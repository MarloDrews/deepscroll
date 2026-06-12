import AsyncStorage from "@react-native-async-storage/async-storage"

// Port of frontend/src/app/lib/savedPosts.ts: same key and meaning, async
// because AsyncStorage is promise-based.
// TODO: replace with a backend endpoint once saves are server-side.
const KEY = "deepscroll_saved"

export async function getSavedPostIds(): Promise<number[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(KEY)) ?? "[]") as number[]
  } catch {
    return []
  }
}

export async function savePost(id: number): Promise<void> {
  const ids = await getSavedPostIds()
  if (!ids.includes(id)) await AsyncStorage.setItem(KEY, JSON.stringify([...ids, id]))
}

export async function unsavePost(id: number): Promise<void> {
  const ids = await getSavedPostIds()
  await AsyncStorage.setItem(KEY, JSON.stringify(ids.filter((x) => x !== id)))
}

export async function isPostSaved(id: number): Promise<boolean> {
  return (await getSavedPostIds()).includes(id)
}
