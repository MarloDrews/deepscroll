import * as SecureStore from "expo-secure-store"
import { BASE_URL } from "../config"

const TOKEN_KEY = "deepscroll_token"

// On web, apiFetch reads the token synchronously from localStorage on every
// call. SecureStore is promise-based (a Keystore/Keychain read), so the
// token is loaded once at startup into this module-level cache and apiFetch
// reads the cache synchronously — same call signature as the web version.
// The JWT lives in SecureStore (encrypted at the OS level), not AsyncStorage:
// AsyncStorage is a plain readable file, and the token grants full account
// access.
let cachedToken: string | null = null

// Call once at app startup (root layout) before authenticated requests.
export async function initAuthToken(): Promise<void> {
  try {
    cachedToken = await SecureStore.getItemAsync(TOKEN_KEY)
  } catch {
    cachedToken = null
  }
}

// Keeps the cache and persistent storage in sync on login/logout.
export async function setAuthToken(token: string | null): Promise<void> {
  cachedToken = token
  if (token === null) await SecureStore.deleteItemAsync(TOKEN_KEY)
  else await SecureStore.setItemAsync(TOKEN_KEY, token)
}

// Synchronous read of the cached token; valid after initAuthToken() resolved
// (the root layout blocks rendering until then). Used by the AuthProvider to
// decide whether a session restore via /api/auth/me is worth attempting.
export function getAuthToken(): string | null {
  return cachedToken
}

// Wrapper around fetch that automatically attaches the Authorization header
// when a token is present. Use this for any API call that may require
// authentication. Ported from frontend/src/app/lib/api.ts.
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) ?? {}),
  }
  // FormData bodies must NOT get an explicit Content-Type — fetch sets
  // multipart/form-data with the correct boundary itself.
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json"
  }
  if (cachedToken) headers["Authorization"] = `Bearer ${cachedToken}`
  return fetch(`${BASE_URL}${path}`, { ...options, headers })
}
