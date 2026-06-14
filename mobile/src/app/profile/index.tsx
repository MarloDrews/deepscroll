import { useEffect, useState } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native"
import { useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as ImagePicker from "expo-image-picker"
import { File as FsFile } from "expo-file-system"
import Svg, { Circle, Path } from "react-native-svg"
import { useAuth } from "../../lib/auth"
import { apiFetch } from "../../lib/api"
import { formatStyle } from "../../lib/formats"
import { colors, fills, fonts, radius } from "../../theme/tokens"
import { Frosted, ghostPillStyle } from "../../components/stage"
import { BackIcon } from "../../components/icons"
import Avatar from "../../components/Avatar"
import VerifiedBadge from "../../components/VerifiedBadge"
import UserListSheet, { type ListUser } from "../../components/UserListSheet"
import BottomNav from "../../components/BottomNav"
import Toast, { useToast } from "../../components/Toast"

// Port of frontend/src/app/profile/page.tsx (Stage): the own account page —
// avatar with camera-button upload, identity header with counts, knowledge
// score slab, content rows, bio editor, follow-requests panel for private
// accounts and the settings slab (privacy toggle, username/password
// accordions, sign out, delete account). Same API calls and error handling;
// the file input becomes expo-image-picker.

interface EloData {
  global_rating: number | null
  formats: Record<string, { rating: number; answered_count: number }>
}

interface FollowRequest {
  username: string
  is_verified: number
  avatar_url?: string | null
  created_at: string
}

type Panel = "username" | "password" | "delete" | null

const fieldStyle = {
  backgroundColor: fills.chrome,
  borderRadius: radius.field,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontFamily: fonts.sans,
  fontSize: 14,
  color: colors.ink,
} as const

const slabStyle = {
  marginHorizontal: 24,
  marginBottom: 16,
  backgroundColor: fills.slab,
  borderRadius: radius.slab,
} as const

function ErrorText({ children }: { children: string }) {
  return (
    <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.bad }}>{children}</Text>
  )
}

function Chevron({ open }: { open?: boolean }) {
  return (
    <Svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      style={{ transform: [{ rotate: open ? "90deg" : "0deg" }] }}
    >
      <Path
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
        stroke={colors["ink-muted"]}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// Small flat lamp pill (web .btn-primary at text-xs sizes). Plain object
// styles throughout this file: NativeWind's css-interop drops Pressable
// style callback functions (nativewind issue #1105).
function SmallPrimary({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: "rgba(124, 111, 255, 0.15)",
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 7,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: "#9d93ff" }}>{label}</Text>
    </Pressable>
  )
}

function SmallGhost({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: fills.chrome,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 7,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: colors["ink-body"] }}>{label}</Text>
    </Pressable>
  )
}

// Full-width submit pill used inside the accordion forms.
function SubmitButton({ label, onPress, disabled, destructive }: { label: string; onPress: () => void; disabled?: boolean; destructive?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: destructive ? "rgba(192, 88, 112, 0.15)" : "rgba(124, 111, 255, 0.15)",
        borderRadius: 999,
        paddingVertical: 12,
        alignItems: "center",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: destructive ? colors.bad : "#9d93ff" }}>
        {label}
      </Text>
    </Pressable>
  )
}

export default function ProfileSettingsScreen() {
  const { user, loading, logout, updateUser } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { message, show } = useToast()

  const [open, setOpen] = useState<Panel>(null)

  const [newUsername, setNewUsername] = useState("")
  const [usernameError, setUsernameError] = useState("")
  const [usernameLoading, setUsernameLoading] = useState(false)

  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [deletePw, setDeletePw] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [bio, setBio] = useState("")
  const [bioLoading, setBioLoading] = useState(false)
  const [bioError, setBioError] = useState("")

  const [privacyLoading, setPrivacyLoading] = useState(false)

  const [pendingRequests, setPendingRequests] = useState<FollowRequest[]>([])
  const [showRequests, setShowRequests] = useState(false)
  const [requestActionLoading, setRequestActionLoading] = useState<string | null>(null)

  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState("")

  const [elo, setElo] = useState<EloData | null>(null)

  const [followerCount, setFollowerCount] = useState<number | null>(null)
  const [followingCount, setFollowingCount] = useState<number | null>(null)
  const [postCount, setPostCount] = useState<number | null>(null)
  const [listOpen, setListOpen] = useState<"followers" | "following" | null>(null)
  const [listUsers, setListUsers] = useState<ListUser[] | null>(null)

  // Redirect unauthenticated visitors to login.
  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [user, loading, router])

  // Sync bio state when user loads.
  useEffect(() => {
    if (user) setBio(user.bio ?? "")
  }, [user])

  // Fetch pending follow requests for private accounts.
  useEffect(() => {
    if (!user?.is_private) return
    apiFetch(`/api/users/${user.username}/follow-requests`)
      .then((r) => r.json())
      .then(setPendingRequests)
      .catch(() => {})
  }, [user])

  // Fetch knowledge score.
  useEffect(() => {
    if (!user) return
    apiFetch(`/api/users/${user.username}/elo`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setElo)
      .catch(() => {})
  }, [user])

  // Fetch follower / following / post counts.
  useEffect(() => {
    if (!user) return
    apiFetch(`/api/users/${user.username}/profile`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        setFollowerCount(data.follower_count)
        setFollowingCount(data.following_count)
        setPostCount(data.post_count)
      })
      .catch(() => {})
  }, [user])

  function openList(kind: "followers" | "following") {
    if (!user) return
    setListOpen(kind)
    setListUsers(null)
    apiFetch(`/api/users/${user.username}/${kind}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setListUsers)
      .catch(() => setListUsers([]))
  }

  if (loading || !user) return null

  async function handleAvatarChange() {
    setAvatarError("")
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    const asset = result.assets?.[0]
    if (result.canceled || !asset) return
    setAvatarLoading(true)
    try {
      const form = new FormData()
      // Expo's WinterCG fetch rejects the classic RN {uri, name, type}
      // FormData part; the expo-file-system File class implements Blob and
      // is the SDK 56 supported way to put a local file into FormData.
      form.append("file", new FsFile(asset.uri) as unknown as Blob)
      const r = await apiFetch("/api/auth/me/avatar", { method: "POST", body: form })
      const data = await r.json()
      if (!r.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Failed to upload picture.")
      updateUser(data)
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Failed to upload picture.")
    } finally {
      setAvatarLoading(false)
    }
  }

  function togglePanel(panel: Exclude<Panel, null>) {
    setOpen((prev) => (prev === panel ? null : panel))
    setUsernameError("")
    setPasswordError("")
    setDeleteError("")
    setNewUsername("")
    setCurrentPw("")
    setNewPw("")
    setDeletePw("")
  }

  async function handleChangeUsername() {
    setUsernameError("")
    setUsernameLoading(true)
    try {
      const r = await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ username: newUsername }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Failed to update username.")
      updateUser(data)
      setOpen(null)
    } catch (err) {
      setUsernameError(err instanceof Error ? err.message : "Failed to update username.")
    } finally {
      setUsernameLoading(false)
    }
  }

  async function handleChangePassword() {
    setPasswordError("")
    setPasswordLoading(true)
    try {
      const r = await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Failed to change password.")
      setOpen(null)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password.")
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleteError("")
    setDeleteLoading(true)
    try {
      const r = await apiFetch("/api/auth/me", {
        method: "DELETE",
        body: JSON.stringify({ current_password: deletePw }),
      })
      if (!r.ok) {
        const data = await r.json()
        throw new Error(typeof data.detail === "string" ? data.detail : "Failed to delete account.")
      }
      await logout()
      router.replace("/")
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account.")
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleSaveBio() {
    setBioError("")
    setBioLoading(true)
    try {
      const r = await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ bio }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Failed to save bio.")
      updateUser(data)
      show("Bio saved")
    } catch (err) {
      setBioError(err instanceof Error ? err.message : "Failed to save bio.")
    } finally {
      setBioLoading(false)
    }
  }

  async function handleTogglePrivacy() {
    if (!user) return
    setPrivacyLoading(true)
    try {
      const r = await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ is_private: !user.is_private }),
      })
      const data = await r.json()
      if (r.ok) updateUser(data)
    } finally {
      setPrivacyLoading(false)
    }
  }

  async function handleAcceptRequest(requesterUsername: string) {
    setRequestActionLoading(requesterUsername)
    try {
      await apiFetch(`/api/users/${requesterUsername}/follow/accept`, { method: "POST" })
      setPendingRequests((prev) => prev.filter((r) => r.username !== requesterUsername))
    } finally {
      setRequestActionLoading(null)
    }
  }

  async function handleDeclineRequest(requesterUsername: string) {
    setRequestActionLoading(requesterUsername)
    try {
      await apiFetch(`/api/users/${requesterUsername}/follow/reject`, { method: "DELETE" })
      setPendingRequests((prev) => prev.filter((r) => r.username !== requesterUsername))
    } finally {
      setRequestActionLoading(null)
    }
  }

  const rowDivider = { borderBottomWidth: 1, borderBottomColor: colors.edge } as const
  const rowLabel = { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink } as const

  return (
    <View style={{ flex: 1, backgroundColor: colors["surface-0"] }}>
      {/* Floating frosted back circle (web btn-icon) */}
      <Frosted
        borderRadius={999}
        style={{ position: "absolute", top: insets.top + 12, left: 16, zIndex: 10, width: 44, height: 44 }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <BackIcon size={24} color={colors["ink-dim"]} />
        </Pressable>
      </Frosted>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: insets.top + 64, paddingBottom: insets.bottom + 120 }}
        >
          {/* Header — avatar + identity */}
          <View style={{ alignItems: "center", paddingHorizontal: 24, paddingBottom: 24 }}>
            <View style={{ marginBottom: 16, opacity: avatarLoading ? 0.5 : 1 }}>
              <Avatar username={user.username} avatarUrl={user.avatar_url} size={88} verified={user.is_verified} />
              <Pressable
                onPress={handleAvatarChange}
                disabled={avatarLoading}
                hitSlop={6}
                style={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors["surface-3"],
                  borderWidth: 2,
                  borderColor: colors["surface-0"],
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                    stroke={colors["ink-dim"]}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle cx={12} cy={13} r={4} stroke={colors["ink-dim"]} strokeWidth={1.8} />
                </Svg>
              </Pressable>
            </View>
            {avatarError ? <ErrorText>{avatarError}</ErrorText> : null}

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontFamily: fonts.serifMedium, fontSize: 24, color: colors.ink }}>
                @{user.username}
              </Text>
              {user.is_verified > 0 && <VerifiedBadge size={20} level={user.is_verified} />}
            </View>

            {/* Posts / Followers / Following row */}
            <View style={{ flexDirection: "row", gap: 24, marginTop: 12, marginBottom: 4 }}>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontFamily: fonts.mono, fontSize: 16, color: colors.ink }}>{postCount ?? "—"}</Text>
                <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-muted"] }}>Posts</Text>
              </View>
              <Pressable style={{ alignItems: "center" }} onPress={() => openList("followers")}>
                <Text style={{ fontFamily: fonts.mono, fontSize: 16, color: colors.ink }}>{followerCount ?? "—"}</Text>
                <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-muted"] }}>Followers</Text>
              </Pressable>
              <Pressable style={{ alignItems: "center" }} onPress={() => openList("following")}>
                <Text style={{ fontFamily: fonts.mono, fontSize: 16, color: colors.ink }}>{followingCount ?? "—"}</Text>
                <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-muted"] }}>Following</Text>
              </Pressable>
            </View>

            <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors["ink-muted"], marginTop: 4 }}>
              {user.email}
            </Text>
            <Pressable
              onPress={() => router.push(`/profile/${user.username}`)}
              style={[ghostPillStyle, { marginTop: 8 }]}
            >
              <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: colors["ink-body"] }}>
                View public profile
              </Text>
            </Pressable>
          </View>

          {/* Knowledge score */}
          <View style={[slabStyle, { paddingHorizontal: 20, paddingVertical: 16 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View>
                <Text style={rowLabel}>Knowledge score</Text>
                <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-muted"], marginTop: 2 }}>
                  Answer quizzes or train to raise it
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.mono, fontSize: 24, color: colors.lamp }}>
                {elo?.global_rating ?? "—"}
              </Text>
            </View>
            {elo && Object.keys(elo.formats).length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {Object.entries(elo.formats).map(([fmt, data]) => {
                  const style = formatStyle(fmt)
                  return (
                    <View
                      key={fmt}
                      style={{ backgroundColor: fills.chrome, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}
                    >
                      <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: style.accent }}>
                        {style.label} {Math.round(data.rating)}
                      </Text>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* My content */}
          <View style={[slabStyle, { overflow: "hidden" }]}>
            <Pressable
              onPress={() => router.push(`/profile/${user.username}`)}
              style={[rowDivider, { paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
            >
              <Text style={rowLabel}>My posts</Text>
              <Chevron />
            </Pressable>
            <Pressable
              onPress={() => router.push(`/profile/${user.username}?tab=saved`)}
              style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
            >
              <Text style={rowLabel}>Saved posts</Text>
              <Chevron />
            </Pressable>
          </View>

          {/* Bio */}
          <View style={[slabStyle, { paddingHorizontal: 20, paddingVertical: 16 }]}>
            <Text
              style={{
                fontFamily: fonts.sansSemiBold,
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: colors["ink-dim"],
                marginBottom: 6,
              }}
            >
              Bio
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              maxLength={160}
              multiline
              numberOfLines={3}
              placeholder="Tell people about yourself..."
              placeholderTextColor={colors["ink-muted"]}
              style={[fieldStyle, { minHeight: 72, textAlignVertical: "top" }]}
            />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors["ink-faint"] }}>
                {bio.length}/160
              </Text>
              <Pressable onPress={handleSaveBio} disabled={bioLoading} hitSlop={6}>
                <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: colors.lamp, opacity: bioLoading ? 0.5 : 1 }}>
                  {bioLoading ? "Saving..." : "Save bio"}
                </Text>
              </Pressable>
            </View>
            {bioError ? <ErrorText>{bioError}</ErrorText> : null}
          </View>

          {/* Follow Requests (private accounts only) */}
          {user.is_private && (
            <View style={[slabStyle, { overflow: "hidden" }]}>
              <Pressable
                onPress={() => setShowRequests((v) => !v)}
                style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={rowLabel}>Follow Requests</Text>
                  {pendingRequests.length > 0 && (
                    <View
                      style={{
                        backgroundColor: colors.lamp,
                        borderRadius: 10,
                        minWidth: 20,
                        height: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 4,
                      }}
                    >
                      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors["surface-0"] }}>
                        {pendingRequests.length}
                      </Text>
                    </View>
                  )}
                </View>
                <Chevron open={showRequests} />
              </Pressable>
              {showRequests && (
                <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}>
                  {pendingRequests.length === 0 ? (
                    <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors["ink-muted"] }}>
                      No pending requests.
                    </Text>
                  ) : (
                    pendingRequests.map((req) => (
                      <View
                        key={req.username}
                        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}
                      >
                        <Pressable
                          onPress={() => router.push(`/profile/${req.username}`)}
                          style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 }}
                        >
                          <Avatar username={req.username} avatarUrl={req.avatar_url} size={32} verified={req.is_verified} />
                          <Text numberOfLines={1} style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink }}>
                            @{req.username}
                          </Text>
                          {req.is_verified > 0 && <VerifiedBadge size={14} level={req.is_verified} />}
                        </Pressable>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <SmallPrimary
                            label="Accept"
                            onPress={() => handleAcceptRequest(req.username)}
                            disabled={requestActionLoading === req.username}
                          />
                          <SmallGhost
                            label="Decline"
                            onPress={() => handleDeclineRequest(req.username)}
                            disabled={requestActionLoading === req.username}
                          />
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          )}

          {/* Settings slab */}
          <View style={[slabStyle, { overflow: "hidden", marginBottom: 32 }]}>
            {/* Private Account toggle */}
            <View
              style={[rowDivider, { paddingHorizontal: 20, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
            >
              <View>
                <Text style={rowLabel}>Private account</Text>
                <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-muted"], marginTop: 2 }}>
                  New followers must be approved
                </Text>
              </View>
              <Switch
                value={user.is_private}
                onValueChange={handleTogglePrivacy}
                disabled={privacyLoading}
                trackColor={{ false: fills.active10, true: colors.lamp }}
                thumbColor={colors.ink}
              />
            </View>

            {/* Change username */}
            <View style={rowDivider}>
              <Pressable
                onPress={() => togglePanel("username")}
                style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
              >
                <Text style={rowLabel}>Change username</Text>
                <Chevron open={open === "username"} />
              </Pressable>
              {open === "username" && (
                <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}>
                  <TextInput
                    placeholder="New username"
                    placeholderTextColor={colors["ink-muted"]}
                    value={newUsername}
                    onChangeText={setNewUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={fieldStyle}
                  />
                  {usernameError ? <ErrorText>{usernameError}</ErrorText> : null}
                  <SubmitButton
                    label={usernameLoading ? "Saving..." : "Save username"}
                    onPress={handleChangeUsername}
                    disabled={usernameLoading || !newUsername.trim()}
                  />
                </View>
              )}
            </View>

            {/* Change password */}
            <View style={rowDivider}>
              <Pressable
                onPress={() => togglePanel("password")}
                style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
              >
                <Text style={rowLabel}>Change password</Text>
                <Chevron open={open === "password"} />
              </Pressable>
              {open === "password" && (
                <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}>
                  <TextInput
                    placeholder="Current password"
                    placeholderTextColor={colors["ink-muted"]}
                    value={currentPw}
                    onChangeText={setCurrentPw}
                    secureTextEntry
                    style={fieldStyle}
                  />
                  <TextInput
                    placeholder="New password"
                    placeholderTextColor={colors["ink-muted"]}
                    value={newPw}
                    onChangeText={setNewPw}
                    secureTextEntry
                    style={fieldStyle}
                  />
                  {passwordError ? <ErrorText>{passwordError}</ErrorText> : null}
                  <SubmitButton
                    label={passwordLoading ? "Saving..." : "Save password"}
                    onPress={handleChangePassword}
                    disabled={passwordLoading || !currentPw || !newPw}
                  />
                </View>
              )}
            </View>

            {/* Sign out */}
            <Pressable
              onPress={async () => {
                await logout()
                router.replace("/")
              }}
              style={[rowDivider, { paddingHorizontal: 20, paddingVertical: 16 }]}
            >
              <Text style={rowLabel}>Sign out</Text>
            </Pressable>

            {/* Delete account */}
            <View>
              <Pressable
                onPress={() => togglePanel("delete")}
                style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
              >
                <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.bad }}>Delete account</Text>
                <Chevron open={open === "delete"} />
              </Pressable>
              {open === "delete" && (
                <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}>
                  <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors["ink-dim"] }}>
                    This will permanently delete your account and all your data.
                  </Text>
                  <TextInput
                    placeholder="Enter password to confirm"
                    placeholderTextColor={colors["ink-muted"]}
                    value={deletePw}
                    onChangeText={setDeletePw}
                    secureTextEntry
                    style={fieldStyle}
                  />
                  {deleteError ? <ErrorText>{deleteError}</ErrorText> : null}
                  <SubmitButton
                    label={deleteLoading ? "Deleting..." : "Confirm delete"}
                    onPress={handleDeleteAccount}
                    disabled={deleteLoading || !deletePw}
                    destructive
                  />
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Followers / Following floating sheet */}
      {listOpen && (
        <UserListSheet title={listOpen} users={listUsers} onClose={() => setListOpen(null)} />
      )}

      <BottomNav active="profile" onComingSoon={() => show("Coming soon")} />
      <Toast message={message} />
    </View>
  )
}
