// Neural text-to-speech that runs entirely in the browser: a Piper voice
// (VITS model, ~60 MB one-time download cached in the browser's private
// file system) via @diffusionstudio/vits-web. Inference runs in a worker
// thread and is faster than realtime on a plain CPU — chosen over heavier
// models (Kokoro was tried first) precisely for that speed. Free, no
// backend; the built-in speechSynthesis voices remain as fallback.

export const PIPER_VOICE = "en_US-hfc_female-medium"

export type SynthesizeFn = (text: string) => Promise<Blob>

let loader: Promise<SynthesizeFn | null> | null = null

// Resolves to null when the voice cannot load (offline on first use, very
// old browser); callers then fall back to speechSynthesis. The dynamic
// import keeps vits-web and its ML runtime out of the app's main bundle.
export function loadPiper(): Promise<SynthesizeFn | null> {
  if (!loader) {
    loader = (async () => {
      try {
        const tts = await import("@diffusionstudio/vits-web")
        // Fetch the model up front so the first sentence does not also pay
        // for the download; predict() then reads it from the cache.
        const cached = await tts.stored()
        if (!cached.includes(PIPER_VOICE)) await tts.download(PIPER_VOICE)
        return (text: string) => tts.predict({ text, voiceId: PIPER_VOICE })
      } catch {
        loader = null // allow a retry on the next start
        return null
      }
    })()
  }
  return loader
}
