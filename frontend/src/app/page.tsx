"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    if (!localStorage.getItem("deepscroll_interests")) {
      router.replace("/onboarding")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p className="text-zinc-500 text-sm">Feed coming soon...</p>
    </div>
  )
}
