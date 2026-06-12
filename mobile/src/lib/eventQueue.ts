import { AppState } from "react-native"
import { apiFetch } from "./api"

// Port of frontend/src/app/lib/eventQueue.ts: module-level batch queue that
// flushes every 5s or at 5 events to POST /api/events. apiFetch attaches the
// auth token, so the backend can attribute likes/views to the user.
// The web flushes on visibilitychange/beforeunload; the React Native
// equivalent is the app leaving the foreground (AppState).

interface QueuedEvent {
  post_id: number
  event_type: "view" | "like"
  duration_ms?: number
}

const queue: QueuedEvent[] = []
let timer: ReturnType<typeof setTimeout> | null = null

const BATCH_SIZE = 5
const FLUSH_INTERVAL_MS = 5000

function flush() {
  if (queue.length === 0) return
  if (timer) { clearTimeout(timer); timer = null }
  const batch = queue.splice(0)
  apiFetch("/api/events", {
    method: "POST",
    body: JSON.stringify(batch),
  }).catch(() => {})
}

function scheduleFlush() {
  if (timer) return
  timer = setTimeout(flush, FLUSH_INTERVAL_MS)
}

export function hasPendingLike(postId: number): boolean {
  return queue.some((e) => e.event_type === "like" && e.post_id === postId)
}

export function cancelPendingLike(postId: number): void {
  const index = queue.findIndex((e) => e.event_type === "like" && e.post_id === postId)
  if (index !== -1) queue.splice(index, 1)
}

export function queueEvent(event: QueuedEvent) {
  // Safety net: never queue a second like for the same post while one is pending.
  if (event.event_type === "like" && hasPendingLike(event.post_id)) return
  queue.push(event)
  if (queue.length >= BATCH_SIZE) {
    flush()
  } else {
    scheduleFlush()
  }
}

AppState.addEventListener("change", (state) => {
  if (state !== "active") flush()
})
