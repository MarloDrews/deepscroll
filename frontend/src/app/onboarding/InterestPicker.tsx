"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Interest {
  id: number
  name: string
  slug: string
}

export default function InterestPicker({ interests }: { interests: Interest[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (localStorage.getItem("deepscroll_interests")) {
      router.replace("/")
    }
  }, [router])

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  function handleContinue() {
    localStorage.setItem("deepscroll_interests", JSON.stringify([...selected]))
    router.push("/")
  }

  const canContinue = selected.size >= 2

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center px-6 pt-14 pb-10">
      <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase">
        Deepscroll
      </p>

      <div className="mt-12 text-center">
        <h1 className="text-3xl font-bold text-white leading-tight">
          What are you into?
        </h1>
        <p className="text-zinc-400 text-sm mt-3">
          Pick at least 2 topics to personalize your feed.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center mt-10 max-w-sm">
        {interests.map((i) => {
          const isSelected = selected.has(i.slug)
          return (
            <button
              key={i.id}
              onClick={() => toggle(i.slug)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? "bg-white text-zinc-950"
                  : "border border-zinc-700 text-zinc-300 hover:border-zinc-400 hover:text-white"
              }`}
            >
              {i.name}
            </button>
          )
        })}
      </div>

      <div className="mt-auto pt-12 w-full max-w-sm">
        <p className="text-zinc-500 text-sm text-center mb-3">
          {selected.size} of {interests.length} selected
        </p>
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`w-full h-12 rounded-full font-semibold text-sm transition-all ${
            canContinue
              ? "bg-white text-zinc-950 hover:bg-zinc-100"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
