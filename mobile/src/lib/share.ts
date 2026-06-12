import { Share } from "react-native"
import { WEB_URL } from "../config"

// The web uses navigator.share (with a clipboard fallback). The native
// counterpart for sharing text/URLs is React Native's Share API, which opens
// the system share sheet. expo-sharing is NOT used here on purpose: it can
// only share local files (it requires a file:// URI), not links.
export async function sharePost(post: { id: number; title: string }): Promise<void> {
  try {
    await Share.share({ message: `${post.title}\n${WEB_URL}/post/${post.id}` })
  } catch {
    // User dismissed the share sheet.
  }
}
