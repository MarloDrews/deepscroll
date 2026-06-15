import { useCallback, useEffect, useRef, useState } from "react"
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native"
import type { TextStyle } from "react-native"
import { BlurTargetView, BlurView } from "expo-blur"
import * as Haptics from "expo-haptics"
import { useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import { useAuth } from "../../lib/auth"
import { apiFetch } from "../../lib/api"
import { fetchNextQuestion, submitAnswer } from "../../lib/train/trainApi"
import { mockQuestions } from "../../lib/train/mockQuestions"
import { SLOW_MS, START_ELO } from "../../lib/train/elo"
import type { AnswerResult, ChoiceQuestion, MarathonQuestion } from "../../types/train"
import NumberSlider from "./NumberSlider"
import { colors, fills, fonts, radius } from "../../theme/tokens"
import {
  Frosted,
  MessageSlab,
  PulsingSlab,
  SlabGlow,
  ghostPillStyle,
} from "../stage"
import { FlameIcon } from "../icons"
import PrimaryButton from "../PrimaryButton"
import { mono, sans, sansSemiBold } from "../sections/primitives"

// Mock questions + simulated Elo. Swap is isolated to trainApi.ts (see
// TRAIN_MARATHON_PROMPTS.md Appendix).
//
// The full Train marathon experience as a self-contained component. The Train
// tab mounts it (see Prompt 4). State machine:
//   intro -> question -> feedback -> (question | summary)
// The marathon rating is the CLIENT-SIDE simulation from lib/train/elo.ts (not
// the server's authoritative per-format Elo yet). Logged-out users can still
// play for practice, but their rating is not persisted. All motion is gated on
// the reduced-motion preference, falling back to instant state changes.

type Stage = "intro" | "question" | "feedback" | "summary"

// Short, tasteful springs (no gratuitous motion). Press is snappy; the reveal
// and streak pops have a touch more bounce.
const PRESS_SPRING = { damping: 18, stiffness: 320, mass: 0.6 }
const REVEAL_SPRING = { damping: 12, stiffness: 260, mass: 0.7 }
const STREAK_SPRING = { damping: 10, stiffness: 240, mass: 0.6 }

const labelCaps: TextStyle = {
  fontFamily: fonts.mono,
  fontSize: 10,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: colors["ink-muted"],
}

// A real multiple-choice question used purely as the blurred teaser on the
// intro. It is never answerable there (a BlurView sits over it); we pick a
// choice question (not a numeric/slider one) so the teaser shows the familiar
// option pills through the blur.
const PREVIEW_QUESTION = mockQuestions.find(
  (q): q is ChoiceQuestion => q.kind !== "numeric",
)!

interface Props {
  // Optional exit hook for the summary's secondary button (Prompt 4 may switch
  // tabs); falls back to routing to the feed when not supplied.
  onExit?: () => void
}

// A label-caps stat for the top strip (mono value over a tiny label).
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={{ alignItems: "center", gap: 2 }}>
      <Text style={labelCaps}>{label}</Text>
      <Text style={mono(15, colors.ink)}>{value}</Text>
    </View>
  )
}

// Streak stat with a flame that brightens as the streak grows and resets
// visibly on a wrong answer. The flame uses the warm `save` token (a streak
// reads as fire); its opacity carries the brightness, cold/faint at zero and
// full by ~5 in a row.
function StreakStat({ streak, reduceMotion }: { streak: number; reduceMotion: boolean }) {
  const scale = useSharedValue(1)
  const prev = useRef(streak)

  useEffect(() => {
    if (reduceMotion) {
      prev.current = streak
      return
    }
    if (streak > prev.current) {
      // Grew: a small flare pop.
      scale.value = withSequence(withSpring(1.3, STREAK_SPRING), withSpring(1, STREAK_SPRING))
    } else if (streak === 0 && prev.current > 0) {
      // Reset: a quick shrink so the flame visibly goes out.
      scale.value = withSequence(withTiming(0.7, { duration: 110 }), withSpring(1, STREAK_SPRING))
    }
    prev.current = streak
  }, [streak, reduceMotion, scale])

  const flameStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const intensity = Math.min(streak / 5, 1)
  const flameOpacity = streak === 0 ? 0.3 : 0.5 + 0.5 * intensity
  const numberColor = streak > 0 ? colors.save : colors["ink-muted"]

  return (
    <View style={{ alignItems: "center", gap: 2 }}>
      <Text style={labelCaps}>Streak</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Animated.View style={[flameStyle, { opacity: flameOpacity }]}>
          <FlameIcon size={15} color={colors.save} filled={streak > 0} />
        </Animated.View>
        <Text style={mono(15, numberColor)}>{streak}</Text>
      </View>
    </View>
  )
}

// A single option pill, used in both the question and feedback stages so the
// two states reconcile (no remount) and the selection -> reveal feels
// continuous. Springs on press; the correct option pops once on reveal.
function OptionRow({
  label,
  border,
  background,
  textColor,
  onPress,
  disabled,
  revealPop,
  reduceMotion,
}: {
  label: string
  border: string
  background: string
  textColor: string
  onPress?: () => void
  disabled?: boolean
  revealPop: boolean
  reduceMotion: boolean
}) {
  const scale = useSharedValue(1)
  const didPop = useRef(false)

  useEffect(() => {
    if (revealPop && !didPop.current) {
      didPop.current = true
      if (!reduceMotion) {
        scale.value = withSequence(withSpring(1.03, REVEAL_SPRING), withSpring(1, REVEAL_SPRING))
      }
    }
    if (!revealPop) didPop.current = false
  }, [revealPop, reduceMotion, scale])

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Animated.View style={rowStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPress && !reduceMotion ? () => (scale.value = withSpring(0.97, PRESS_SPRING)) : undefined}
        onPressOut={onPress && !reduceMotion ? () => (scale.value = withSpring(1, PRESS_SPRING)) : undefined}
        disabled={disabled}
        style={{
          borderRadius: radius.slab,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: background,
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <Text style={sans(16, textColor)}>{label}</Text>
      </Pressable>
    </Animated.View>
  )
}

// A number that ticks from `from` to `to` over ~500ms; jumps instantly when
// reduced motion is on or there is no change.
function TickingNumber({
  from,
  to,
  reduceMotion,
  style,
}: {
  from: number
  to: number
  reduceMotion: boolean
  style: object
}) {
  const [val, setVal] = useState(to)
  useEffect(() => {
    if (reduceMotion || from === to) {
      setVal(to)
      return
    }
    const duration = 500
    const start = Date.now()
    let raf = 0
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / duration)
      setVal(Math.round(from + (to - from) * t))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [from, to, reduceMotion])
  return <Text style={style}>{val}</Text>
}

// Thin elapsed-time bar that fills toward SLOW_MS to nudge speed. Purely visual:
// it never auto-fails the question. Keyed by question id so it resets each time.
// Only mounted when motion is allowed.
function ElapsedBar() {
  const progress = useSharedValue(0)
  useEffect(() => {
    progress.value = 0
    progress.value = withTiming(1, { duration: SLOW_MS, easing: Easing.linear })
  }, [progress])
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }))
  return (
    <View style={{ height: 3, borderRadius: 999, backgroundColor: fills.dotOff, overflow: "hidden" }}>
      <Animated.View
        style={[{ height: "100%", borderRadius: 999, backgroundColor: colors.lamp + "66" }, barStyle]}
      />
    </View>
  )
}

// Small frosted note for logged-out players: rating won't be saved + login link.
function GuestNote() {
  const router = useRouter()
  return (
    <Frosted fill={fills.chrome} borderRadius={radius.field} style={{ alignSelf: "stretch" }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={sans(13, colors["ink-dim"])}>
          Playing as a guest — your rating won't be saved.{" "}
          <Text style={sansSemiBold(13, colors.lamp)} onPress={() => router.push("/login")}>
            Log in
          </Text>
        </Text>
      </View>
    </Frosted>
  )
}

export default function Marathon({ onExit }: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  // Clear the floating FeedTabBar capsule that overlays the pager (it sits at
  // insets.top + 12 and is 44 tall), so marathon content is not hidden behind it.
  const topPad = insets.top + 68

  const [reduceMotion, setReduceMotion] = useState(false)
  const [loaded, setLoaded] = useState(false) // initial persisted-progress load done
  const [stage, setStage] = useState<Stage>("intro")
  const [busy, setBusy] = useState(false) // fetching / submitting against the seam
  const [error, setError] = useState("")

  // Rating state. sessionElo is the live simulated rating; startElo is its value
  // when the current session began (for the summary's net change); lifetimeAnswered
  // is the persisted scored-answer count that drives the K-factor.
  const [sessionElo, setSessionElo] = useState(START_ELO)
  const [startElo, setStartElo] = useState(START_ELO)
  const [lifetimeAnswered, setLifetimeAnswered] = useState(0)

  // Per-session progress.
  const [answeredIds, setAnsweredIds] = useState<string[]>([])
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [results, setResults] = useState<AnswerResult[]>([])

  // Active question + the result/choice driving the feedback view.
  const [current, setCurrent] = useState<MarathonQuestion | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  // The live slider value for a numeric question (the player's pending answer).
  const [sliderValue, setSliderValue] = useState(0)
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null)
  const questionStartMs = useRef(0)
  const retry = useRef<() => void>(() => {})
  // Target for the intro's blurred teaser. On Android the BlurView blurs this
  // referenced view; on iOS it blurs the backdrop and the ref is ignored.
  const previewTargetRef = useRef<View>(null)

  // Reduced-motion preference (gates every animation in this component).
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {})
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion)
    return () => sub.remove()
  }, [])

  // Seed the rating once. Logged-in players start from their server knowledge
  // score (the same number as the profile "Knowledge score"); a null score
  // (never answered) starts at START_ELO. Guests start fresh at START_ELO and
  // are never persisted, so the "won't be saved" promise stays honest.
  useEffect(() => {
    let alive = true
    ;(async () => {
      if (user) {
        try {
          const r = await apiFetch(`/api/users/${user.username}/elo`)
          const d = r.ok ? await r.json() : null
          if (!alive) return
          setSessionElo(d?.global_rating ?? START_ELO)
        } catch {
          if (alive) setSessionElo(START_ELO)
        }
      }
      if (alive) setLoaded(true)
    })()
    return () => {
      alive = false
    }
  }, [user])

  // Fetch the next question. On the first load of a session, an empty pool would
  // be unusual; mid-session, a null means the pool is exhausted -> summary.
  const loadQuestion = useCallback(async (ids: string[], elo: number) => {
    setError("")
    setBusy(true)
    try {
      const q = await fetchNextQuestion({ currentElo: elo, answeredIds: ids })
      if (!q) {
        setStage("summary")
        return
      }
      setCurrent(q)
      setSelected(null)
      setLastResult(null)
      // Numeric questions start the slider at a random step within their limits
      // (so it never anchors on the midpoint / a hintable spot, and the player
      // always has to move it to commit).
      if (q.kind === "numeric") {
        const step = q.step ?? 1
        const steps = Math.floor((q.max - q.min) / step)
        const rand = q.min + Math.round(Math.random() * steps) * step
        setSliderValue(Math.min(q.max, Math.max(q.min, rand)))
      }
      questionStartMs.current = Date.now()
      setStage("question")
    } catch {
      retry.current = () => loadQuestion(ids, elo)
      setError("Could not load the next question.")
    } finally {
      setBusy(false)
    }
  }, [])

  function handleStart() {
    setStartElo(sessionElo)
    loadQuestion(answeredIds, sessionElo)
  }

  // Shared bookkeeping once an answer is scored (same for choice and slider).
  function applyResult(result: AnswerResult) {
    if (!current) return
    const nextStreak = result.correct ? streak + 1 : 0

    setLastResult(result)
    setSessionElo(result.eloAfter)
    setAnsweredIds([...answeredIds, current.id])
    setLifetimeAnswered(lifetimeAnswered + 1)
    setStreak(nextStreak)
    setBestStreak((b) => Math.max(b, nextStreak))
    setResults((r) => [...r, result])

    // No client persistence: logged-in scores are saved server-side by
    // /api/train/answer; guests are pure practice and never persisted.

    // Haptic feedback: success for correct, warning for wrong.
    Haptics.notificationAsync(
      result.correct
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    ).catch(() => {})

    setStage("feedback")
  }

  async function handleSelect(index: number) {
    if (!current || current.kind === "numeric" || stage !== "question" || busy || selected !== null) return
    const answerMs = Date.now() - questionStartMs.current
    setSelected(index)
    setBusy(true)
    setError("")
    try {
      const result = await submitAnswer({
        question: current,
        chosenIndex: index,
        answerMs,
        currentElo: sessionElo,
        // K-factor continuity for the guest local simulation: pass the lifetime
        // scored count so it stays stable (K=16). Ignored on the logged-in path,
        // where the server tracks the count and computes the delta.
        answeredCountInSession: lifetimeAnswered,
        loggedIn: !!user,
      })
      applyResult(result)
    } catch {
      setSelected(null)
      retry.current = () => handleSelect(index)
      setError("Could not submit your answer.")
    } finally {
      setBusy(false)
    }
  }

  // Submit the slider's current value for a numeric question.
  async function handleSubmitNumeric() {
    if (!current || current.kind !== "numeric" || stage !== "question" || busy) return
    const answerMs = Date.now() - questionStartMs.current
    setBusy(true)
    setError("")
    try {
      const result = await submitAnswer({
        question: current,
        chosenValue: sliderValue,
        answerMs,
        currentElo: sessionElo,
        answeredCountInSession: lifetimeAnswered,
        loggedIn: !!user,
      })
      applyResult(result)
    } catch {
      retry.current = () => handleSubmitNumeric()
      setError("Could not submit your answer.")
    } finally {
      setBusy(false)
    }
  }

  function handleNext() {
    // answeredIds already includes the just-answered question, so this either
    // returns a fresh question or null (pool exhausted -> summary).
    loadQuestion(answeredIds, sessionElo)
  }

  function trainAgain() {
    // Keep the carried-over rating + lifetime count; reset only the session.
    setAnsweredIds([])
    setStreak(0)
    setBestStreak(0)
    setResults([])
    setSelected(null)
    setLastResult(null)
    setStartElo(sessionElo)
    loadQuestion([], sessionElo)
  }

  function handleExit() {
    if (onExit) onExit()
    else router.push("/")
  }

  // --- Render helpers -------------------------------------------------------

  // QuizSection coloring conventions: correct option always revealed in good,
  // a wrong pick in bad, the rest dimmed. Rest state is a frosted white/6% pill.
  function optionColors(i: number) {
    if (stage !== "feedback" || !lastResult) {
      return { border: "transparent", background: fills.chrome, text: colors["ink-body"] }
    }
    if (i === lastResult.correctIndex) {
      return { border: colors.good, background: colors.good + "1a", text: colors.good }
    }
    if (i === selected) {
      return { border: colors.bad, background: colors.bad + "1a", text: colors.bad }
    }
    return { border: colors.edge, background: fills.chrome, text: colors["ink-faint"] }
  }

  const bigRating = { fontFamily: fonts.mono, fontSize: 44, color: colors.lamp, lineHeight: 52 }

  // The top strip is rendered first in both question and feedback so the streak
  // flame reconciles across the transition (its pop/reset plays in place).
  function renderStrip() {
    return (
      <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center" }}>
        <Stat label="Rating" value={Math.round(sessionElo)} />
        <StreakStat streak={streak} reduceMotion={reduceMotion} />
      </View>
    )
  }

  // The answer surface differs by question kind: option pills for choice,
  // the tactile slider for numeric. Rendered in both question and feedback.
  function renderAnswerArea() {
    if (!current) return null
    if (current.kind === "numeric") return renderSlider()
    return renderOptions()
  }

  // The numeric slider, interactive while answering and locked (with the correct
  // value revealed) in feedback. The Submit button only shows while answering.
  function renderSlider() {
    if (!current || current.kind !== "numeric") return null
    const answered = stage === "feedback" && !!lastResult
    return (
      <View style={{ gap: 16 }}>
        <NumberSlider
          min={current.min}
          max={current.max}
          step={current.step ?? 1}
          unit={current.unit}
          value={sliderValue}
          onChange={setSliderValue}
          disabled={answered || busy}
          showResult={answered}
          correct={lastResult?.correct}
          correctValue={lastResult?.correctValue}
          reduceMotion={reduceMotion}
        />
        {stage === "question" ? (
          <PrimaryButton label="Submit" onPress={handleSubmitNumeric} disabled={busy} />
        ) : null}
      </View>
    )
  }

  // Options are rendered (positionally) in both stages so OptionRow instances
  // persist; the correct row pops once when feedback reveals it.
  function renderOptions() {
    if (!current || current.kind === "numeric") return null
    const interactive = stage === "question"
    return (
      <View style={{ gap: 10 }}>
        {current.options.map((opt, i) => {
          const c = optionColors(i)
          return (
            <OptionRow
              key={i}
              label={opt}
              border={c.border}
              background={c.background}
              textColor={c.text}
              onPress={interactive ? () => handleSelect(i) : undefined}
              disabled={!interactive || selected !== null || busy}
              revealPop={stage === "feedback" && !!lastResult && i === lastResult.correctIndex}
              reduceMotion={reduceMotion}
            />
          )
        })}
      </View>
    )
  }

  function renderIntro() {
    return (
      <View style={{ gap: 20 }}>
        {/* Header: "Train" on the left, the rating in its own highlighted
            lamp-tinted container on the right. */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontFamily: fonts.serifMedium, fontSize: 34, color: colors.ink }}>Train</Text>
          <View
            style={{
              borderRadius: radius.field,
              borderWidth: 1,
              borderColor: colors.lamp + "59",
              backgroundColor: colors.lamp + "1f",
              paddingHorizontal: 16,
              paddingVertical: 8,
              alignItems: "center",
            }}
          >
            <Text style={[labelCaps, { color: colors.lamp }]}>Rating</Text>
            <Text style={{ fontFamily: fonts.mono, fontSize: 30, color: colors.lamp, lineHeight: 36 }}>
              {Math.round(sessionElo)}
            </Text>
          </View>
        </View>

        <Text style={[sans(15, colors["ink-dim"]), { textAlign: "center" }]}>
          Answer to climb your rating. Faster correct answers earn more.
        </Text>

        {/* Blurred teaser question with the Start button centered on top: a real question
            rendered into a BlurTargetView with a BlurView laid over it, so the
            shape of the challenge shows but it stays unreadable until you start.
            On Android the BlurView blurs the referenced target; on iOS it blurs
            the backdrop. A faint scrim reinforces it on either platform. */}
        <Frosted fill={fills.slab} borderRadius={radius.slab} style={{ overflow: "hidden" }}>
          <SlabGlow accent={colors.lamp} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
          <BlurTargetView ref={previewTargetRef}>
            <View style={{ paddingHorizontal: 24, paddingVertical: 28, gap: 14 }}>
              <Text style={{ fontFamily: fonts.serif, fontSize: 22, lineHeight: 30, color: colors.ink }}>
                {PREVIEW_QUESTION.prompt}
              </Text>
              <View style={{ gap: 10 }}>
                {PREVIEW_QUESTION.options.map((opt, i) => (
                  <View
                    key={i}
                    style={{
                      borderRadius: radius.slab,
                      backgroundColor: fills.active12,
                      paddingHorizontal: 20,
                      paddingVertical: 16,
                    }}
                  >
                    <Text style={sans(16, colors.ink)}>{opt}</Text>
                  </View>
                ))}
              </View>
            </View>
          </BlurTargetView>
          {/* Light blur so the question reads as a recognizable but unreadable
              shape. tint "default" + a modest intensity avoids darkening the
              card into an empty rectangle. */}
          <BlurView
            tint="default"
            intensity={18}
            blurMethod="dimezisBlurView"
            blurTarget={previewTargetRef}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            pointerEvents="none"
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Dark grey pill with a lamp outline and lamp text, sized up so it
                stands out over the blurred card. */}
            <Pressable
              onPress={handleStart}
              style={{
                backgroundColor: colors["surface-2"],
                borderWidth: 1,
                borderColor: colors.lamp,
                borderRadius: 999,
                paddingHorizontal: 40,
                paddingVertical: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: fonts.sansMedium, fontSize: 16, color: colors.lamp }}>Start</Text>
            </Pressable>
          </View>
        </Frosted>

        {!user && <GuestNote />}
      </View>
    )
  }

  function renderQuestion() {
    if (!current) return null
    return (
      <View style={{ gap: 16 }}>
        {renderStrip()}

        <Frosted fill={fills.slab} borderRadius={radius.slab} style={{ overflow: "hidden" }}>
          <SlabGlow accent={colors.lamp} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
          <View style={{ paddingHorizontal: 24, paddingVertical: 28, gap: 16 }}>
            {!reduceMotion && <ElapsedBar key={current.id} />}
            <Text style={{ fontFamily: fonts.serif, fontSize: 22, lineHeight: 30, color: colors.ink }}>
              {current.prompt}
            </Text>
          </View>
        </Frosted>

        {renderAnswerArea()}
      </View>
    )
  }

  function renderFeedback() {
    if (!current || !lastResult) return null
    const good = lastResult.correct
    const deltaColor = lastResult.delta >= 0 ? colors.good : colors.bad
    return (
      <View style={{ gap: 16 }}>
        {renderStrip()}

        <Frosted fill={fills.slab} borderRadius={radius.slab} style={{ overflow: "hidden" }}>
          <SlabGlow accent={colors.lamp} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
          <View style={{ paddingHorizontal: 24, paddingVertical: 28, gap: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: fonts.sansSemiBold,
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: good ? colors.good : colors.bad,
                }}
              >
                {good ? "Correct" : "Incorrect"}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <TickingNumber
                  from={lastResult.eloBefore}
                  to={lastResult.eloAfter}
                  reduceMotion={reduceMotion}
                  style={mono(18, colors.lamp)}
                />
                <View
                  style={{
                    borderRadius: 999,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    backgroundColor: deltaColor + "26",
                  }}
                >
                  <Text style={mono(13, deltaColor)}>
                    {lastResult.delta >= 0 ? "+" : ""}
                    {lastResult.delta}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={{ fontFamily: fonts.serif, fontSize: 20, lineHeight: 28, color: colors.ink }}>
              {current.prompt}
            </Text>
          </View>
        </Frosted>

        {renderAnswerArea()}

        {lastResult.explanation ? (
          <Text style={sans(14, colors["ink-dim"], { lineHeight: 21 })}>{lastResult.explanation}</Text>
        ) : null}

        <PrimaryButton label="Next" onPress={handleNext} />
      </View>
    )
  }

  function renderSummary() {
    const total = results.length
    const correct = results.filter((r) => r.correct).length
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
    const net = Math.round(sessionElo) - Math.round(startElo)
    const netColor = net >= 0 ? colors.good : colors.bad
    return (
      <View style={{ gap: 20 }}>
        <Frosted fill={fills.slab} borderRadius={radius.slab} style={{ overflow: "hidden" }}>
          <SlabGlow accent={colors.lamp} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
          <View style={{ paddingHorizontal: 24, paddingVertical: 32, gap: 18, alignItems: "center" }}>
            <Text style={{ fontFamily: fonts.serifMedium, fontSize: 26, color: colors.ink }}>
              Session complete
            </Text>
            <Text style={bigRating}>{Math.round(sessionElo)}</Text>
            <View style={{ alignSelf: "stretch", gap: 10 }}>
              <SummaryRow label="Answered" value={String(total)} />
              <SummaryRow label="Accuracy" value={`${accuracy}%`} />
              <SummaryRow label="Best streak" value={String(bestStreak)} />
              <SummaryRow
                label="Rating change"
                value={`${net >= 0 ? "+" : ""}${net}`}
                valueColor={netColor}
              />
            </View>
          </View>
        </Frosted>

        {/* The mock pool is finite; frame hitting its end as intentional. */}
        <MessageSlab>
          <Text style={[sans(14, colors["ink-dim"]), { textAlign: "center" }]}>
            You've cleared the current set — more questions coming soon.
          </Text>
        </MessageSlab>

        {!user && <GuestNote />}

        <View style={{ gap: 10 }}>
          <PrimaryButton label="Train again" onPress={trainAgain} />
          <Pressable onPress={handleExit} style={{ ...ghostPillStyle, alignItems: "center" }}>
            <Text style={sansSemiBold(14, colors["ink-body"])}>Back to feed</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  function renderError() {
    return (
      <MessageSlab>
        <Text style={[sans(14, colors["ink-dim"]), { textAlign: "center" }]}>{error}</Text>
        <Pressable
          onPress={() => {
            setError("")
            retry.current()
          }}
          style={{ ...ghostPillStyle, alignItems: "center" }}
        >
          <Text style={sansSemiBold(14, colors["ink-body"])}>Try again</Text>
        </Pressable>
      </MessageSlab>
    )
  }

  let body: React.ReactNode
  if (!loaded || (busy && !current)) {
    // Initial progress load, or fetching the very first question (nothing to
    // show yet). Once a question exists we keep it on screen through submits and
    // next-question fetches so the card never flashes to the dark background.
    body = <PulsingSlab height={320} />
  } else if (error) {
    body = renderError()
  } else if (stage === "intro") {
    body = renderIntro()
  } else if (stage === "question") {
    body = renderQuestion()
  } else if (stage === "feedback") {
    body = renderFeedback()
  } else {
    body = renderSummary()
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: topPad, paddingBottom: 96 }}
      showsVerticalScrollIndicator={false}
    >
      {body}
    </ScrollView>
  )
}

// One label/value row in the summary slab.
function SummaryRow({
  label,
  value,
  valueColor,
}: {
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={sans(14, colors["ink-dim"])}>{label}</Text>
      <Text style={mono(15, valueColor ?? colors.ink)}>{value}</Text>
    </View>
  )
}
