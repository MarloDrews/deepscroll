import { useEffect, useState } from "react"
import { Pressable, Text, View } from "react-native"
import { useAuth } from "../../lib/auth"
import { apiFetch } from "../../lib/api"
import type { QuizItem } from "../../types/post"
import { SectionBlock, SectionLabel, mono, sans, sansSemiBold } from "./primitives"
import MathText from "../MathText"
import { colors, fonts, radius } from "../../theme/tokens"

// Port of frontend/src/components/sections/QuizSection.tsx
// Tappable options POST /api/quiz/answer; green/red correctness +
// explanation + Elo delta chip; answered state restored from
// GET /api/quiz/state so questions can never be re-scored.

interface Props {
  content: QuizItem[]
  postId: number
}

interface AnswerResult {
  chosenIndex: number
  correct: boolean
  correctIndex: number
  explanation: string | null
  // Elo info only present for fresh, scored, authenticated answers
  delta?: number
  rating?: number
}

function optionColors(i: number, result: AnswerResult | undefined) {
  if (!result) {
    return { border: colors["edge-strong"], background: "transparent", text: colors["ink-body"] }
  }
  if (i === result.correctIndex) {
    return { border: colors.good, background: colors.good + "1a", text: colors.good }
  }
  if (i === result.chosenIndex) {
    return { border: colors.bad, background: colors.bad + "1a", text: colors.bad }
  }
  return { border: colors.edge, background: "transparent", text: colors["ink-faint"] }
}

function QuizCard({
  item,
  index,
  postId,
  result,
  locked,
  onResult,
}: {
  item: QuizItem
  index: number
  postId: number
  result: AnswerResult | undefined
  locked: boolean
  onResult: (index: number, result: AnswerResult) => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function answer(chosenIndex: number) {
    if (result || submitting || locked) return
    setSubmitting(true)
    setError("")
    try {
      const r = await apiFetch("/api/quiz/answer", {
        method: "POST",
        body: JSON.stringify({ post_id: postId, question_index: index, chosen_index: chosenIndex }),
      })
      if (!r.ok) throw new Error("Could not submit answer.")
      const d = await r.json()
      onResult(index, {
        chosenIndex,
        correct: d.correct,
        correctIndex: d.correct_index,
        explanation: d.explanation,
        delta: d.scored && !d.already_answered ? d.elo?.delta : undefined,
        rating: d.scored && !d.already_answered ? d.elo?.rating : undefined,
      })
    } catch {
      setError("Could not submit answer. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View
      style={{
        backgroundColor: colors["surface-1"],
        borderWidth: 1,
        borderColor: colors.edge,
        borderRadius: radius.card,
        overflow: "hidden",
      }}
    >
      <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
          <Text style={[sansSemiBold(15, colors.ink, { lineHeight: 20 }), { flex: 1 }]}>
            <MathText text={item.question} />
          </Text>
          {result?.delta !== undefined && (
            <View
              style={{
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 2,
                backgroundColor: (result.delta >= 0 ? colors.good : colors.bad) + "26",
              }}
            >
              <Text style={mono(12, result.delta >= 0 ? colors.good : colors.bad)}>
                {result.delta >= 0 ? "+" : ""}
                {result.delta}
              </Text>
            </View>
          )}
        </View>
        <View style={{ marginTop: 12, gap: 8 }}>
          {item.options.map((opt, i) => {
            const c = optionColors(i, result)
            return (
              <Pressable
                key={i}
                onPress={() => answer(i)}
                disabled={!!result || submitting}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: radius.field,
                  borderWidth: 1,
                  borderColor: c.border,
                  backgroundColor: c.background,
                  opacity: submitting && !result ? 0.6 : 1,
                }}
              >
                <Text style={sans(15, c.text, { lineHeight: 20 })}>
                  <MathText text={opt} />
                </Text>
              </Pressable>
            )
          })}
        </View>
        {error !== "" && <Text style={[sans(12, colors.bad), { marginTop: 8 }]}>{error}</Text>}
      </View>

      {result && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <Text
            style={{
              fontFamily: fonts.sansSemiBold,
              fontSize: 11,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: result.correct ? colors.good : colors.bad,
              marginBottom: 4,
            }}
          >
            {result.correct ? "Correct" : "Incorrect"}
          </Text>
          {result.explanation ? (
            <Text style={sans(14, colors["ink-dim"], { lineHeight: 21 })}>
              <MathText text={result.explanation} />
            </Text>
          ) : null}
        </View>
      )}
    </View>
  )
}

export default function QuizSection({ content, postId }: Props) {
  const { user } = useAuth()
  const [results, setResults] = useState<Record<number, AnswerResult>>({})
  const [stateLoaded, setStateLoaded] = useState(false)

  // Restore previously answered questions so they can never be re-scored.
  useEffect(() => {
    if (!user) {
      setStateLoaded(true)
      return
    }
    apiFetch(`/api/quiz/state/${postId}`)
      .then((r) => (r.ok ? r.json() : { answers: [] }))
      .then(
        (d: {
          answers: {
            question_index: number
            chosen_index: number
            correct: boolean
            correct_index: number
            explanation: string | null
          }[]
        }) => {
          const restored: Record<number, AnswerResult> = {}
          for (const a of d.answers) {
            restored[a.question_index] = {
              chosenIndex: a.chosen_index,
              correct: a.correct,
              correctIndex: a.correct_index,
              explanation: a.explanation,
            }
          }
          setResults((prev) => ({ ...restored, ...prev }))
        }
      )
      .catch(() => {})
      .finally(() => setStateLoaded(true))
  }, [user, postId])

  function handleResult(index: number, result: AnswerResult) {
    setResults((prev) => ({ ...prev, [index]: result }))
  }

  const answered = Object.keys(results).length
  const correct = Object.values(results).filter((r) => r.correct).length
  const allDone = answered === content.length && content.length > 0
  let lastRating: number | undefined
  for (const r of Object.values(results)) {
    if (r.rating !== undefined) lastRating = r.rating
  }

  return (
    <SectionBlock gap={16}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <SectionLabel>Quiz</SectionLabel>
        <Text style={mono(12, colors["ink-muted"])}>
          {answered}/{content.length} answered
        </Text>
      </View>

      {!user && (
        <Text style={[sans(12, colors["ink-muted"]), { marginTop: -8 }]}>
          Log in to build your knowledge score with this quiz.
        </Text>
      )}

      {content.map((item, i) => (
        <QuizCard
          key={i}
          item={item}
          index={i}
          postId={postId}
          result={results[i]}
          locked={!stateLoaded}
          onResult={handleResult}
        />
      ))}

      {allDone && (
        <View
          style={{
            backgroundColor: colors["surface-1"],
            borderWidth: 1,
            borderColor: colors.edge,
            borderRadius: radius.card,
            paddingHorizontal: 16,
            paddingVertical: 12,
            alignItems: "center",
            gap: 4,
          }}
        >
          <Text style={sansSemiBold(14, colors.ink)}>
            {correct}/{content.length} correct
          </Text>
          {lastRating !== undefined && (
            <Text style={sans(12, colors["ink-muted"])}>
              Knowledge score:{" "}
              <Text style={mono(12, colors.lamp)}>{Math.round(lastRating)}</Text>
            </Text>
          )}
        </View>
      )}
    </SectionBlock>
  )
}
