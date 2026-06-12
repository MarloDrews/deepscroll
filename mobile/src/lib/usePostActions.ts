import { useEffect, useRef, useState } from "react"
import { apiFetch } from "./api"
import { queueEvent, hasPendingLike, cancelPendingLike } from "./eventQueue"
import {
  likePost,
  unlikePost,
  isPostLiked,
  getCachedLikeCount,
  setCachedLikeCount,
  isLikeSent,
  markLikeSent,
  unmarkLikeSent,
} from "./likedPosts"
import { savePost, unsavePost, isPostSaved } from "./savedPosts"

// Shared like/save state for PostCard and the post detail screen. Mirrors
// the handler logic in frontend PostCard.tsx / post/[id]/page.tsx, including
// the server-count reconciliation formula: GET /likes returns the events the
// backend knows about; local-only likes (+1) and revoked-but-sent likes (-1)
// adjust the displayed count. AsyncStorage is async, so initial state
// arrives via effects instead of useState initializers.
export function usePostActions(postId: number, initialLikeCount: number) {
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(initialLikeCount)
  const [saved, setSaved] = useState(false)
  // Once the user has interacted, background fetches must not clobber the UI.
  const likeInteractedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    isPostLiked(postId).then((v) => {
      if (!cancelled && !likeInteractedRef.current) setLiked(v)
    })
    isPostSaved(postId).then((v) => {
      if (!cancelled) setSaved(v)
    })
    getCachedLikeCount(postId).then((c) => {
      if (!cancelled && c !== null && !likeInteractedRef.current) setLikesCount(c)
    })

    apiFetch(`/api/posts/${postId}/likes`)
      .then((r) => r.json())
      .then(async (d: { count: number }) => {
        if (cancelled || likeInteractedRef.current) return
        const [likedNow, sent] = await Promise.all([isPostLiked(postId), isLikeSent(postId)])
        const onServer = sent && !hasPendingLike(postId)
        const adjust = (likedNow && !onServer ? 1 : 0) - (!likedNow && sent ? 1 : 0)
        const display = d.count + adjust
        if (!cancelled && !likeInteractedRef.current) {
          setLikesCount(display)
          await setCachedLikeCount(postId, display)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [postId])

  async function like() {
    if (await isPostLiked(postId)) return
    likeInteractedRef.current = true
    await likePost(postId)
    setLiked(true)
    setLikesCount((prev) => {
      const n = prev + 1
      setCachedLikeCount(postId, n)
      return n
    })
    if (!(await isLikeSent(postId))) {
      await markLikeSent(postId)
      queueEvent({ post_id: postId, event_type: "like" })
    }
  }

  async function unlike() {
    if (!(await isPostLiked(postId))) return
    likeInteractedRef.current = true
    await unlikePost(postId)
    setLiked(false)
    setLikesCount((prev) => {
      const n = prev - 1
      setCachedLikeCount(postId, n)
      return n
    })
    if (hasPendingLike(postId)) {
      cancelPendingLike(postId)
      await unmarkLikeSent(postId)
    }
  }

  async function toggleLike() {
    if (liked) await unlike()
    else await like()
  }

  async function toggleSave(): Promise<boolean> {
    const next = !saved
    setSaved(next)
    if (next) await savePost(postId)
    else await unsavePost(postId)
    return next
  }

  return { liked, likesCount, saved, like, toggleLike, toggleSave }
}
