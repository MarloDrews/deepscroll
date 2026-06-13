// Picks the most natural-sounding speech voice the browser offers for a
// language. Browsers ship very different sets: Edge has neural "Online
// (Natural)" voices, Chrome has Google network voices, Firefox and the OS
// fall back to plain local voices. Without an explicit pick, browsers often
// default to the most robotic local voice.

export function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null
  const wanted = lang.toLowerCase()
  const base = wanted.split("-")[0]

  let best: SpeechSynthesisVoice | null = null
  let bestScore = 0
  for (const voice of window.speechSynthesis.getVoices()) {
    const vlang = voice.lang.toLowerCase().replace("_", "-")
    if (!vlang.startsWith(base)) continue
    let score = 1
    if (/natural|neural/i.test(voice.name)) score += 8 // Edge neural voices
    if (/google/i.test(voice.name)) score += 4 // Chrome network voices
    if (!voice.localService) score += 2 // network voices sound better in general
    if (vlang === wanted) score += 1 // exact locale over other dialects
    if (score > bestScore) {
      bestScore = score
      best = voice
    }
  }
  return best
}

// Chrome populates getVoices() asynchronously; calling it once early makes
// the list ready by the time the user taps the speaker button.
export function warmVoices() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.getVoices()
  }
}
