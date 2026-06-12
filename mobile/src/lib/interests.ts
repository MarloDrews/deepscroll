import AsyncStorage from "@react-native-async-storage/async-storage"

// Selected interest slugs from onboarding; same key meaning as the web app's
// localStorage "deepscroll_interests". AsyncStorage is fine here (and for the
// liked/saved caches) because the data is not sensitive — only the JWT needs
// SecureStore (see src/lib/api.ts).
const KEY = "deepscroll_interests"

// Returns null when onboarding has not been completed (or the value is
// corrupt), which is the signal to redirect to the onboarding screen.
export async function getInterestSlugs(): Promise<string[] | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as string[]) : null
  } catch {
    return null
  }
}

export async function setInterestSlugs(slugs: string[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(slugs))
}
