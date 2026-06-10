"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/lib/auth"
import { apiFetch } from "@/app/lib/api"
import type { QuizItem } from "../../types/post"
import MathText from "../MathText"

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

function optionClass(i: number, result: AnswerResult | undefined): string {
  if (!result) {
    return "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/60 cursor-pointer"
  }
  if (i === result.correctIndex) {
    return "border-emerald-500 bg-emerald-500/10 text-emerald-200"
  }
  if (i === result.chosenIndex) {
    return "border-red-500 bg-red-500/10 text-red-300"
  }
  return "border-zinc-800 text-zinc-600"
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
    <div className="border border-zinc-700 rounded-xl overflow-hidden">
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-zinc-200 leading-snug">
            <MathText text={item.question} />
          </p>
          {result?.delta !== undefined && (
            <span
              className={`shrink-0 text-xs font-bold rounded-full px-2 py-0.5 ${
                result.delta >= 0
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {result.delta >= 0 ? "+" : ""}{result.delta}
            </span>
          )}
        </div>
        <ol className="mt-3 flex flex-col gap-2">
          {item.options.map((opt, i) => (
            <li key={i}>
              <button
                onClick={() => answer(i)}
                disabled={!!result || submitting}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors disabled:cursor-default ${optionClass(i, result)} ${
                  submitting && !result ? "opacity-60" : ""
                }`}
              >
                <MathText text={opt} />
              </button>
            </li>
          ))}
        </ol>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      {result && (
        <div className="px-4 pb-4">
          <p className={`text-xs font-semibold mb-1 ${result.correct ? "text-emerald-400" : "text-red-400"}`}>
            {result.correct ? "Correct" : "Incorrect"}
          </p>
          {result.explanation && (
            <p className="text-sm text-zinc-400 leading-relaxed">
              <MathText text={result.explanation} />
            </p>
          )}
        </div>
      )}
    </div>
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
      .then((d: { answers: { question_index: number; chosen_index: number; correct: boolean; correct_index: number; explanation: string | null }[] }) => {
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
      })
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
    <div className="px-5 py-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-widest text-zinc-500">Quiz</h3>
        <span className="text-xs text-zinc-500">
          {answered}/{content.length} answered
        </span>
      </div>

      {!user && (
        <p className="text-xs text-zinc-500 -mt-2">
          Log in to build your knowledge score with this quiz.
        </p>
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
        <div className="border border-zinc-700 bg-zinc-900 rounded-xl px-4 py-3 text-center">
          <p className="text-sm text-zinc-200 font-semibold">
            {correct}/{content.length} correct
          </p>
          {lastRating !== undefined && (
            <p className="text-xs text-zinc-500 mt-1">
              Knowledge score: <span className="text-amber-400 font-semibold">{Math.round(lastRating)}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
