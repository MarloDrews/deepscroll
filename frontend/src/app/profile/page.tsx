"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/lib/auth"
import { apiFetch } from "@/app/lib/api"
import BottomNav from "@/app/components/BottomNav"

export default function ProfilePage() {
  const { user, loading, logout, updateUser } = useAuth()
  const router = useRouter()

  // Which settings panel is open: "username" | "password" | "delete" | null
  const [open, setOpen] = useState<"username" | "password" | "delete" | null>(null)

  // Change username form
  const [newUsername, setNewUsername] = useState("")
  const [usernameError, setUsernameError] = useState("")
  const [usernameLoading, setUsernameLoading] = useState(false)

  // Change password form
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Delete account form
  const [deletePw, setDeletePw] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Redirect unauthenticated visitors to login.
  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [user, loading, router])

  if (loading || !user) return null

  function togglePanel(panel: "username" | "password" | "delete") {
    setOpen((prev) => (prev === panel ? null : panel))
    setUsernameError("")
    setPasswordError("")
    setDeleteError("")
    setNewUsername("")
    setCurrentPw("")
    setNewPw("")
    setDeletePw("")
  }

  async function handleChangeUsername(e: React.FormEvent) {
    e.preventDefault()
    setUsernameError("")
    setUsernameLoading(true)
    try {
      const r = await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ username: newUsername }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail ?? "Failed to update username.")
      updateUser(data)
      setOpen(null)
    } catch (err) {
      setUsernameError(err instanceof Error ? err.message : "Failed to update username.")
    } finally {
      setUsernameLoading(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError("")
    setPasswordLoading(true)
    try {
      const r = await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail ?? "Failed to change password.")
      setOpen(null)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password.")
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault()
    setDeleteError("")
    setDeleteLoading(true)
    try {
      const r = await apiFetch("/api/auth/me", {
        method: "DELETE",
        body: JSON.stringify({ current_password: deletePw }),
      })
      if (!r.ok) {
        const data = await r.json()
        throw new Error(data.detail ?? "Failed to delete account.")
      }
      logout()
      router.replace("/")
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account.")
    } finally {
      setDeleteLoading(false)
    }
  }

  // Derive initials from username for the avatar.
  const initial = user.username.charAt(0).toUpperCase()

  const inputClass =
    "w-full bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
  const submitClass =
    "w-full bg-white text-zinc-950 font-semibold py-3 rounded-xl text-sm disabled:opacity-50 transition-opacity"

  return (
    <div className="h-[100dvh] bg-zinc-950 flex justify-center">
      <div className="w-full max-w-[430px] h-[100dvh] relative">
        <div className="h-full overflow-y-auto pb-14 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          aria-label="Go back"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Header — avatar + identity */}
        <div className="flex flex-col items-center pt-16 pb-8 px-6">
          <div className="w-20 h-20 rounded-full bg-violet-900/60 flex items-center justify-center mb-4">
            <span className="text-violet-300 text-2xl font-bold">{initial}</span>
          </div>
          <p className="flex items-center gap-1.5 text-white text-xl font-semibold">
            @{user.username}
            {user.is_verified && (
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Verified" className="flex-shrink-0">
                <circle cx="8" cy="8" r="8" fill="#60a5fa"/>
                <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </p>
          <p className="text-zinc-500 text-sm mt-1">{user.email}</p>
          <button onClick={() => router.push("/my-posts")} className="text-zinc-400 text-sm mt-2">
            My posts →
          </button>
          <button onClick={() => router.push("/saved-posts")} className="text-zinc-400 text-sm mt-1">
            Saved posts →
          </button>
        </div>

        {/* Settings card */}
        <div className="mx-6 mb-8 bg-zinc-900/50 rounded-2xl overflow-hidden">

          {/* Change username */}
          <div className="border-b border-zinc-800/60">
            <button
              onClick={() => togglePanel("username")}
              className="w-full px-5 py-4 flex items-center justify-between text-left"
            >
              <span className="text-white text-sm">Change username</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                className={`w-4 h-4 text-zinc-500 transition-transform ${open === "username" ? "rotate-90" : ""}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            {open === "username" && (
              <form onSubmit={handleChangeUsername} className="px-5 pb-5 flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="New username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  autoComplete="off"
                  required
                  className={inputClass}
                />
                {usernameError && <p className="text-red-400 text-sm">{usernameError}</p>}
                <button type="submit" disabled={usernameLoading} className={submitClass}>
                  {usernameLoading ? "Saving..." : "Save username"}
                </button>
              </form>
            )}
          </div>

          {/* Change password */}
          <div className="border-b border-zinc-800/60">
            <button
              onClick={() => togglePanel("password")}
              className="w-full px-5 py-4 flex items-center justify-between text-left"
            >
              <span className="text-white text-sm">Change password</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                className={`w-4 h-4 text-zinc-500 transition-transform ${open === "password" ? "rotate-90" : ""}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            {open === "password" && (
              <form onSubmit={handleChangePassword} className="px-5 pb-5 flex flex-col gap-3">
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  autoComplete="current-password"
                  required
                  className={inputClass}
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  autoComplete="new-password"
                  required
                  className={inputClass}
                />
                {passwordError && <p className="text-red-400 text-sm">{passwordError}</p>}
                <button type="submit" disabled={passwordLoading} className={submitClass}>
                  {passwordLoading ? "Saving..." : "Save password"}
                </button>
              </form>
            )}
          </div>

          {/* Sign out */}
          <div className="border-b border-zinc-800/60">
            <button
              onClick={() => { logout(); router.replace("/") }}
              className="w-full px-5 py-4 text-left text-red-400 text-sm"
            >
              Sign out
            </button>
          </div>

          {/* Delete account */}
          <div>
            <button
              onClick={() => togglePanel("delete")}
              className="w-full px-5 py-4 flex items-center justify-between text-left"
            >
              <span className="text-red-400 text-sm">Delete account</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                className={`w-4 h-4 text-zinc-500 transition-transform ${open === "delete" ? "rotate-90" : ""}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            {open === "delete" && (
              <form onSubmit={handleDeleteAccount} className="px-5 pb-5 flex flex-col gap-3">
                <p className="text-zinc-400 text-sm">This will permanently delete your account and all your data.</p>
                <input
                  type="password"
                  placeholder="Enter password to confirm"
                  value={deletePw}
                  onChange={(e) => setDeletePw(e.target.value)}
                  autoComplete="current-password"
                  required
                  className={inputClass}
                />
                {deleteError && <p className="text-red-400 text-sm">{deleteError}</p>}
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 transition-opacity"
                >
                  {deleteLoading ? "Deleting..." : "Confirm delete"}
                </button>
              </form>
            )}
          </div>

        </div>
        </div>
        <BottomNav activeTab="profile" />
      </div>
    </div>
  )
}
