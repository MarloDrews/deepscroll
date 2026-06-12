import { useEffect, useRef, useState } from "react"
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native"
import type { GestureResponderEvent } from "react-native"
import Svg, { Line } from "react-native-svg"
import { useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAuth } from "../lib/auth"
import { apiFetch } from "../lib/api"
import { relativeTime } from "../lib/relativeTime"
import { colors, fonts, radius } from "../theme/tokens"
import VerifiedBadge from "./VerifiedBadge"

// Port of frontend/src/app/components/CommentsBottomSheet.tsx: bottom sheet
// over a dimmed backdrop, drag handle (swipe up -> expand to 75%, swipe
// down -> collapse to 50% or close), comment list, sticky input, delete own
// comments. Comment bodies are plain Text — never rendered as HTML.

export interface Comment {
  id: number
  post_id: number
  username: string
  is_verified: number
  body: string
  created_at: string
}

interface Props {
  postId: number
  onClose: () => void
  onCountChange?: (count: number) => void
}

export default function CommentsBottomSheet({ postId, onClose, onCountChange }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const { height: screenHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const [comments, setComments] = useState<Comment[]>([])
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [draft, setDraft] = useState("")
  const [posting, setPosting] = useState(false)
  const [expanded, setExpanded] = useState(false)
  // Positive value = sheet dragged downward (visual feedback only)
  const [dragDelta, setDragDelta] = useState(0)

  const dragStartY = useRef(0)
  const loadedRef = useRef(false)

  useEffect(() => {
    apiFetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((data: Comment[]) => {
        loadedRef.current = true
        setComments(data)
      })
      .catch(() => {})
  }, [postId])

  useEffect(() => {
    if (loadedRef.current) onCountChange?.(comments.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments.length])

  function onHandleTouchStart(e: GestureResponderEvent) {
    dragStartY.current = e.nativeEvent.pageY
  }

  function onHandleTouchMove(e: GestureResponderEvent) {
    const dy = e.nativeEvent.pageY - dragStartY.current
    if (dy > 0) setDragDelta(dy)
  }

  function onHandleTouchEnd(e: GestureResponderEvent) {
    const dy = e.nativeEvent.pageY - dragStartY.current
    setDragDelta(0)
    if (dy < -60) {
      setExpanded(true)
    } else if (dy > 80) {
      if (expanded) setExpanded(false)
      else onClose()
    }
  }

  async function handleDelete(commentId: number) {
    if (deletingId !== null) return
    setDeletingId(commentId)
    try {
      const r = await apiFetch(`/api/comments/${commentId}`, { method: "DELETE" })
      if (r.ok) setComments((prev) => prev.filter((c) => c.id !== commentId))
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSubmit() {
    const body = draft.trim()
    if (!body || posting) return
    setPosting(true)
    try {
      const r = await apiFetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      })
      if (!r.ok) return
      const created: Comment = await r.json()
      setComments((prev) => [created, ...prev])
      setDraft("")
    } finally {
      setPosting(false)
    }
  }

  const sheetHeight = Math.round(screenHeight * (expanded ? 0.75 : 0.5))
  const canSend = draft.trim() !== "" && !posting

  // No statusBarTranslucent: it disables Android's adjustResize, which is
  // what keeps the input bar above the soft keyboard.
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(10, 10, 10, 0.7)", justifyContent: "flex-end" }}
      >
        {/* Sheet — Pressable so taps inside don't bubble to the backdrop */}
        <Pressable
          onPress={() => {}}
          style={{
            height: sheetHeight,
            backgroundColor: colors["surface-1"],
            borderTopWidth: 1,
            borderTopColor: colors.edge,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            transform: dragDelta > 0 ? [{ translateY: dragDelta }] : undefined,
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            {/* Drag handle zone */}
            <View
              onTouchStart={onHandleTouchStart}
              onTouchMove={onHandleTouchMove}
              onTouchEnd={onHandleTouchEnd}
              style={{ paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.edge }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: colors["edge-strong"],
                  borderRadius: 999,
                  alignSelf: "center",
                  marginBottom: 12,
                }}
              />
              <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors["ink-dim"], textAlign: "center" }}>
                {comments.length === 1 ? "1 comment" : `${comments.length} comments`}
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={{ position: "absolute", right: 12, top: 24, padding: 6 }}
              >
                <Svg viewBox="0 0 24 24" width={16} height={16}>
                  <Line x1={18} y1={6} x2={6} y2={18} stroke={colors["ink-muted"]} strokeWidth={2.5} strokeLinecap="round" />
                  <Line x1={6} y1={6} x2={18} y2={18} stroke={colors["ink-muted"]} strokeWidth={2.5} strokeLinecap="round" />
                </Svg>
              </Pressable>
            </View>

            {/* Comment list */}
            <FlatList
              data={comments}
              keyExtractor={(c) => String(c.id)}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 14,
                    color: colors["ink-faint"],
                    textAlign: "center",
                    paddingVertical: 24,
                  }}
                >
                  No comments yet
                </Text>
              }
              renderItem={({ item: comment, index }) => (
                <View
                  style={{
                    marginBottom: 16,
                    paddingBottom: 16,
                    borderBottomWidth: index === comments.length - 1 ? 0 : 1,
                    borderBottomColor: colors.edge,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink }}>
                      {comment.username}
                    </Text>
                    {comment.is_verified > 0 && <VerifiedBadge size={13} level={comment.is_verified} />}
                    <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-muted"] }}>
                      {relativeTime(comment.created_at)}
                    </Text>
                    {user?.username === comment.username && (
                      <Pressable
                        onPress={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        style={{
                          marginLeft: "auto",
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: colors.bad + "66",
                        }}
                      >
                        <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.bad }}>
                          {deletingId === comment.id ? "Deleting..." : "Delete"}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  <Text
                    style={{
                      fontFamily: fonts.sans,
                      fontSize: 14,
                      lineHeight: 21,
                      color: colors["ink-body"],
                      marginTop: 4,
                    }}
                  >
                    {comment.body}
                  </Text>
                </View>
              )}
            />

            {/* Sticky input bar */}
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.edge,
                backgroundColor: colors["surface-1"],
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: 8 + insets.bottom,
              }}
            >
              {user ? (
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    placeholder="Add a comment..."
                    placeholderTextColor={colors["ink-muted"]}
                    maxLength={2000}
                    style={{
                      flex: 1,
                      backgroundColor: colors["surface-2"],
                      borderWidth: 1,
                      borderColor: colors.edge,
                      borderRadius: 999,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      fontFamily: fonts.sans,
                      fontSize: 14,
                      color: colors.ink,
                    }}
                    onSubmitEditing={handleSubmit}
                  />
                  <Pressable
                    onPress={handleSubmit}
                    disabled={!canSend}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: canSend ? colors.lamp : colors["surface-2"],
                    }}
                  >
                    <Svg viewBox="0 0 24 24" width={16} height={16}>
                      <Line
                        x1={22} y1={2} x2={11} y2={13}
                        stroke={canSend ? colors["surface-0"] : colors["ink-muted"]}
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                      <Line
                        x1={22} y1={2} x2={15} y2={22}
                        stroke={canSend ? colors["surface-0"] : colors["ink-muted"]}
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                      <Line
                        x1={15} y1={22} x2={11} y2={13}
                        stroke={canSend ? colors["surface-0"] : colors["ink-muted"]}
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                      <Line
                        x1={11} y1={13} x2={2} y2={9}
                        stroke={canSend ? colors["surface-0"] : colors["ink-muted"]}
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                      <Line
                        x1={2} y1={9} x2={22} y2={2}
                        stroke={canSend ? colors["surface-0"] : colors["ink-muted"]}
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                    </Svg>
                  </Pressable>
                </View>
              ) : (
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 14,
                    color: colors["ink-muted"],
                    textAlign: "center",
                    paddingVertical: 4,
                  }}
                >
                  <Text
                    onPress={() => {
                      onClose()
                      router.push("/login")
                    }}
                    style={{ color: colors["ink-dim"], textDecorationLine: "underline" }}
                  >
                    Sign in
                  </Text>{" "}
                  to comment
                </Text>
              )}
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
