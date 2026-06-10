"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/app/lib/auth"

export default function RegisterPage() {
  const { user, loading, register } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Redirect already-authenticated users away from this form immediately.
  useEffect(() => {
    if (!loading && user) router.replace("/")
  }, [user, loading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await register(email, username, password)
      router.replace("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.")
    } finally {
      setSubmitting(false)
    }
  }

  // Render nothing while loading or redirecting to avoid a flash.
  if (loading || user) return null

  return (
    <div className="h-[100dvh] bg-surface-0 flex justify-center">
      <div className="w-full max-w-[430px] h-[100dvh] flex flex-col items-center justify-center px-6">
        <div className="w-full card px-6 py-8">
          <h1 className="font-serif text-ink text-2xl font-medium mb-1">Create account</h1>
          <p className="text-ink-muted text-sm mb-6">Join Deepscroll</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              required
              className="field text-sm py-3"
            />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              required
              className="field text-sm py-3"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              className="field text-sm py-3"
            />
            {error && <p className="text-bad text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full py-3 mt-1"
            >
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-ink-muted text-sm text-center mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-lamp hover:text-ink transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
