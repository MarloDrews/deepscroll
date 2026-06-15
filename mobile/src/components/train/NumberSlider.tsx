import { useCallback, useEffect, useState } from "react"
import { Text, View } from "react-native"
import * as Haptics from "expo-haptics"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { colors, fills, fonts } from "../../theme/tokens"
import { mono } from "../sections/primitives"

// A custom, tactile slider for Train's numeric questions. Built on gesture-handler
// + reanimated (no slider dependency) so we control every detail of the feel:
//
//   - The value snaps to `step`, and EACH time it crosses to a new step we fire a
//     light selection haptic. That gives the slider real detents — it buzzes like
//     a physical notched dial as you drag, which is the "satisfying" ask.
//   - The thumb follows the finger on the UI thread (no React round-trip lag) and
//     swells while pressed, like a knob you have grabbed.
//   - Tapping anywhere on the track jumps the thumb there.
//
// `min`/`max` are the question's limits; the parent owns `value` so it can submit
// it. In result mode (showResult) the track is locked and the correct value is
// marked with a tick, the thumb tinted good/bad.

const TRACK_H = 6
const THUMB_R = 14 // thumb radius; also the horizontal inset so it never clips
const THUMB_PRESS_SCALE = 1.25
const SPRING = { damping: 15, stiffness: 320, mass: 0.6 }

interface Props {
  min: number
  max: number
  step: number
  value: number
  unit?: string
  onChange: (value: number) => void
  disabled?: boolean
  // Result mode: lock the slider and reveal the correct value.
  showResult?: boolean
  correct?: boolean
  correctValue?: number
  reduceMotion?: boolean
}

// Round a raw value to the nearest step within [min, max]. Marked as a worklet
// because handleTouch calls it on the UI thread (from the gesture); a plain
// function called there crashes the app ("non-worklet function on the UI thread").
function snap(raw: number, min: number, max: number, step: number): number {
  "worklet"
  const clamped = Math.min(max, Math.max(min, raw))
  const snapped = min + Math.round((clamped - min) / step) * step
  return Math.min(max, Math.max(min, snapped))
}

// Format the value with its unit; integers print clean, fractional steps keep
// enough decimals to show the step (e.g. step 0.5 -> "2.5").
function format(value: number, step: number, unit?: string): string {
  const decimals = Number.isInteger(step) ? 0 : String(step).split(".")[1]?.length ?? 1
  return `${value.toFixed(decimals)}${unit ?? ""}`
}

export default function NumberSlider({
  min,
  max,
  step,
  value,
  unit,
  onChange,
  disabled,
  showResult,
  correct,
  correctValue,
  reduceMotion,
}: Props) {
  const [trackW, setTrackW] = useState(0)

  // Thumb scale (swells on grab). Fraction 0..1 of the value along the track,
  // kept on the UI thread so the thumb tracks the finger without lag.
  const pressScale = useSharedValue(1)
  const frac = useSharedValue(max > min ? (value - min) / (max - min) : 0)

  // Keep the shared fraction in sync when the parent resets the value (new
  // question) without a drag — but not while dragging (that would fight the
  // finger). `dragging` lives on the UI thread.
  const dragging = useSharedValue(false)
  useEffect(() => {
    if (!dragging.value && max > min) {
      frac.value = withSpring((value - min) / (max - min), SPRING)
    }
  }, [value, min, max, dragging, frac])

  // Called from the gesture (UI thread) via runOnJS when the snapped value
  // changes: report it up and tick the haptic detent.
  const lastReported = useSharedValue(value)
  const commit = useCallback(
    (v: number) => {
      onChange(v)
      // selectionAsync is the light "detent" tick — exactly the notched feel.
      Haptics.selectionAsync().catch(() => {})
    },
    [onChange],
  )

  // Map a touch x (px within the padded gesture view) to a snapped value, update
  // the thumb, and report when it changed. Runs as a worklet on the UI thread.
  // The track is inset by THUMB_R, so subtract that before scaling to [0, 1].
  const handleTouch = (x: number) => {
    "worklet"
    if (trackW <= 0 || max <= min) return
    const f = Math.min(1, Math.max(0, (x - THUMB_R) / trackW))
    frac.value = f
    const v = snap(min + f * (max - min), min, max, step)
    if (v !== lastReported.value) {
      lastReported.value = v
      runOnJS(commit)(v)
    }
  }

  const pan = Gesture.Pan()
    .enabled(!disabled && !showResult)
    .onBegin((e) => {
      dragging.value = true
      pressScale.value = withSpring(THUMB_PRESS_SCALE, SPRING)
      handleTouch(e.x)
    })
    .onUpdate((e) => handleTouch(e.x))
    .onFinalize(() => {
      dragging.value = false
      pressScale.value = withSpring(1, SPRING)
      // Settle the thumb exactly on the snapped value.
      if (max > min) frac.value = withSpring((lastReported.value - min) / (max - min), SPRING)
    })

  const fillStyle = useAnimatedStyle(() => ({ width: `${frac.value * 100}%` }))
  const thumbStyle = useAnimatedStyle(() => ({
    left: `${frac.value * 100}%`,
    transform: [{ translateX: -THUMB_R }, { scale: reduceMotion ? 1 : pressScale.value }],
  }))

  // Result coloring: green when right, the brand lamp while answering, red ring
  // for a wrong locked-in value.
  const accent = showResult ? (correct ? colors.good : colors.bad) : colors.lamp
  const correctFrac =
    correctValue !== undefined && max > min
      ? Math.min(1, Math.max(0, (correctValue - min) / (max - min)))
      : null

  return (
    <View style={{ gap: 14 }}>
      {/* Big live value readout. */}
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontFamily: fonts.mono, fontSize: 40, lineHeight: 46, color: accent }}>
          {format(value, step, unit)}
        </Text>
        {showResult && correctValue !== undefined && !correct ? (
          <Text style={mono(13, colors.good)}>Answer: {format(correctValue, step, unit)}</Text>
        ) : null}
      </View>

      {/* The track sits in a tall padded row so the whole area is grabbable.
          Horizontal inset = THUMB_R so the thumb never clips at the ends. */}
      <GestureDetector gesture={pan}>
        <View style={{ paddingHorizontal: THUMB_R, paddingVertical: 18 }}>
          <View
            onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
            style={{ height: TRACK_H, borderRadius: 999, backgroundColor: fills.dotOff, justifyContent: "center" }}
          >
            {/* Filled portion up to the thumb. */}
            <Animated.View
              style={[{ position: "absolute", left: 0, height: TRACK_H, borderRadius: 999, backgroundColor: accent }, fillStyle]}
            />
            {/* Correct-value tick (result mode only). */}
            {showResult && correctFrac !== null ? (
              <View
                style={{
                  position: "absolute",
                  left: `${correctFrac * 100}%`,
                  width: 2,
                  height: TRACK_H + 12,
                  marginLeft: -1,
                  borderRadius: 999,
                  backgroundColor: colors.good,
                }}
              />
            ) : null}
            {/* The thumb. */}
            <Animated.View
              style={[
                {
                  position: "absolute",
                  width: THUMB_R * 2,
                  height: THUMB_R * 2,
                  borderRadius: THUMB_R,
                  backgroundColor: colors.ink,
                  borderWidth: 3,
                  borderColor: accent,
                },
                thumbStyle,
              ]}
            />
          </View>
        </View>
      </GestureDetector>

      {/* Min / max limit labels. */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: THUMB_R }}>
        <Text style={mono(12, colors["ink-muted"])}>{format(min, step, unit)}</Text>
        <Text style={mono(12, colors["ink-muted"])}>{format(max, step, unit)}</Text>
      </View>
    </View>
  )
}
