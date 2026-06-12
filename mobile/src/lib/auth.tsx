import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { apiFetch, getAuthToken, setAuthToken } from "./api"

// Port of frontend/src/app/lib/auth.tsx. Same context shape and logic; the
// only difference is storage: the JWT goes through setAuthToken (SecureStore)
// instead of localStorage, and logout is async because of that.

export interface AuthUser {
  id: number
  email: string
  username: string
  created_at: string
  is_verified: number
  is_private: boolean
  bio: string | null
  avatar_url: string | null
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: AuthUser) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// FastAPI returns detail as a string for HTTPException but as an array of
// objects for 422 validation errors; both must become a readable message.
function detailToMessage(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    const first = detail[0]
    if (first && typeof first.msg === "string") return first.msg.replace(/^Value error, /, "")
  }
  return fallback
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount, check if there is a stored token and restore the session.
  // If the token is expired or invalid, clear it silently. The root layout
  // only renders after initAuthToken() resolved, so getAuthToken() is valid.
  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      setLoading(false)
      return
    }
    apiFetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error("token invalid")
        return r.json() as Promise<AuthUser>
      })
      .then((data) => setUser(data))
      .catch(() => setAuthToken(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string): Promise<void> {
    const r = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    const data = await r.json()
    if (!r.ok) throw new Error(detailToMessage(data.detail, "Login failed."))
    await setAuthToken(data.access_token)
    setUser(data.user as AuthUser)
  }

  async function register(email: string, username: string, password: string): Promise<void> {
    const r = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    })
    const data = await r.json()
    if (!r.ok) throw new Error(detailToMessage(data.detail, "Registration failed."))
    await setAuthToken(data.access_token)
    setUser(data.user as AuthUser)
  }

  async function logout(): Promise<void> {
    await setAuthToken(null)
    setUser(null)
  }

  function updateUser(updated: AuthUser): void {
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
