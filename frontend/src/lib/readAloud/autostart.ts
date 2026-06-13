// Hands the "start reading when the detail page opens" request from the
// feed card's speaker button to the detail page. sessionStorage survives the
// client-side navigation but not a freshly opened share link, which is the
// behavior we want (links never start talking on their own).

const KEY = "readAloudAutostart"

export function requestAutoRead(postId: number) {
  try {
    sessionStorage.setItem(KEY, String(postId))
  } catch {
    // Storage unavailable (private mode quirks): the tap simply opens the post.
  }
}

// Returns true exactly once per request, and only for the matching post.
export function consumeAutoRead(postId: number): boolean {
  try {
    const v = sessionStorage.getItem(KEY)
    if (v === null) return false
    sessionStorage.removeItem(KEY)
    return v === String(postId)
  } catch {
    return false
  }
}
