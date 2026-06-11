"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import { useAuth } from "@/app/lib/auth"
import { apiFetch } from "@/app/lib/api"
import { getSavedPostIds } from "@/app/lib/savedPosts"
import { getLikedPostIds } from "@/app/lib/likedPosts"
import BottomNav from "@/app/components/BottomNav"
import VerifiedBadge from "@/components/VerifiedBadge"
import PostRow from "@/components/PostRow"
import Spinner from "@/components/Spinner"
import Avatar from "@/components/Avatar"

interface ProfileData {
  username: string
  is_verified: number
  is_private: boolean
  bio: string | null
  avatar_url: string | null
  follower_count: number
  following_count: number
  post_count: number
  follow_status: string | null
}

interface EloData {
  global_rating: number | null
  formats: Record<string, { rating: number; answered_count: number }>
}

interface ListUser {
  username: string
  is_verified: number
  is_private: boolean
  avatar_url: string | null
}

interface Post {
  id: number
  format: string
  title: string
  status: string
  created_at: string
}

type Tab = "posts" | "saved" | "liked"

export default function PublicProfilePage() {
  const params = useParams()
  const username = params.username as string
  const router = useRouter()
  const { user } = useAuth()

  const [savedPosts, setSavedPosts] = useState<Post[] | null>(null)
  const [likedPosts, setLikedPosts] = useState<Post[] | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("posts")
  const [followLoading, setFollowLoading] = useState(false)
  const [listOpen, setListOpen] = useState<"followers" | "following" | null>(null)
  const [listUsers, setListUsers] = useState<ListUser[] | null>(null)

  const isOwnProfile = user?.username === username

  // Profile, elo and posts via SWR: repeat visits render the cached data
  // instantly and refresh silently in the background. Error mapping mirrors
  // the previous fetch handlers exactly.
  const {
    data: profile,
    error: profileError,
    mutate: mutateProfile,
  } = useSWR<ProfileData>(`/api/users/${username}/profile`)
  const error = profileError ? "Profile not found." : ""

  const { data: eloData } = useSWR<EloData>(`/api/users/${username}/elo`)
  const elo = eloData ?? null

  function openList(kind: "followers" | "following") {
    setListOpen(kind)
    setListUsers(null)
    apiFetch(`/api/users/${username}/${kind}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setListUsers)
      .catch(() => setListUsers([]))
  }

  const { data: postsData, error: postsError } = useSWR<Post[]>(`/api/feed/user/${username}`)
  const posts: Post[] | null = postsError ? [] : postsData ?? null

  // Saved/liked tabs: only load for own profile from localStorage
  useEffect(() => {
    if (!isOwnProfile) return
    const ids = getSavedPostIds()
    if (ids.length === 0) { setSavedPosts([]); return }
    Promise.all(ids.map((id) => apiFetch(`/api/posts/${id}`).then((r) => (r.ok ? r.json() : null))))
      .then((results) => setSavedPosts(results.filter(Boolean) as Post[]))
      .catch(() => setSavedPosts([]))
  }, [isOwnProfile])

  useEffect(() => {
    if (!isOwnProfile) return
    const ids = getLikedPostIds()
    if (ids.length === 0) { setLikedPosts([]); return }
    Promise.all(ids.map((id) => apiFetch(`/api/posts/${id}`).then((r) => (r.ok ? r.json() : null))))
      .then((results) => setLikedPosts(results.filter(Boolean) as Post[]))
      .catch(() => setLikedPosts([]))
  }, [isOwnProfile])

  async function handleFollow() {
    if (!profile) return
    setFollowLoading(true)
    try {
      // Optimistic update written into the SWR cache (revalidate: false keeps
      // the previous behavior of trusting the computed counts, no refetch).
      const followStatus = profile.follow_status
      if (followStatus === "accepted" || followStatus === "pending") {
        await apiFetch(`/api/users/${username}/follow`, { method: "DELETE" })
        mutateProfile((p) => p ? { ...p, follow_status: "none", follower_count: Math.max(0, p.follower_count - (followStatus === "accepted" ? 1 : 0)) } : p, { revalidate: false })
      } else {
        const r = await apiFetch(`/api/users/${username}/follow`, { method: "POST" })
        const data = await r.json()
        mutateProfile((p) => p ? { ...p, follow_status: data.status, follower_count: data.status === "accepted" ? p.follower_count + 1 : p.follower_count } : p, { revalidate: false })
      }
    } finally {
      setFollowLoading(false)
    }
  }

  const canSeePrivateContent = isOwnProfile || profile?.follow_status === "accepted" || !profile?.is_private

  if (error) {
    return (
      <div className="h-[100dvh] bg-surface-0 flex justify-center">
        <div className="w-full max-w-[430px] flex items-center justify-center">
          <p className="text-ink-dim text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="h-[100dvh] bg-surface-0 flex justify-center">
        <div className="w-full max-w-[430px] flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] bg-surface-0 flex justify-center">
      <div className="w-full max-w-[430px] h-[100dvh] relative overflow-y-auto pb-20 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">

        {/* Header */}
        <div className="flex items-center px-4 pt-4 pb-2">
          <button
            onClick={() => router.back()}
            className="btn-icon"
            aria-label="Go back"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="flex-1 text-center text-ink font-semibold text-base">{username}</span>
          {isOwnProfile ? (
            <button
              onClick={() => router.push("/profile")}
              className="btn-icon"
              aria-label="Settings"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          ) : (
            <button className="btn-icon" aria-label="More options">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>
          )}
        </div>

        {/* Profile section */}
        <div className="px-4 pt-4 pb-2">
          {/* Avatar */}
          <Avatar username={username} avatarUrl={profile.avatar_url} size={72} verified={profile.is_verified} className="mb-3" />

          {/* Username + verified */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-serif text-ink text-2xl font-medium">{username}</span>
            {profile.is_verified > 0 && <VerifiedBadge size={18} level={profile.is_verified} />}
          </div>

          {/* Private label */}
          {profile.is_private && (
            <p className="text-ink-muted text-xs mb-1">Private account</p>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-ink-body text-sm mb-3">{profile.bio}</p>
          )}

          {/* Stats row */}
          <div className="flex gap-6 mb-4">
            <div className="text-center">
              <p className="text-ink font-bold text-base font-mono">{profile.post_count}</p>
              <p className="text-ink-muted text-xs">Posts</p>
            </div>
            <button className="text-center" onClick={() => openList("followers")}>
              <p className="text-ink font-bold text-base font-mono">{profile.follower_count}</p>
              <p className="text-ink-muted text-xs">Followers</p>
            </button>
            <button className="text-center" onClick={() => openList("following")}>
              <p className="text-ink font-bold text-base font-mono">{profile.following_count}</p>
              <p className="text-ink-muted text-xs">Following</p>
            </button>
            <div className="text-center">
              <p className="text-lamp font-bold text-base font-mono">
                {elo?.global_rating ?? "—"}
              </p>
              <p className="text-ink-muted text-xs">Knowledge</p>
            </div>
          </div>

          {/* Follow / Edit Profile button */}
          {isOwnProfile ? (
            <Link
              href="/profile"
              className="btn btn-ghost w-full py-2"
            >
              Edit Profile
            </Link>
          ) : user ? (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`btn w-full py-2 ${followLoading ? "opacity-50" : ""} ${
                profile.follow_status === "accepted" || profile.follow_status === "pending"
                  ? "btn-ghost"
                  : "btn-primary"
              }`}
            >
              {profile.follow_status === "accepted" ? "Following" : profile.follow_status === "pending" ? "Requested" : "Follow"}
            </button>
          ) : (
            <Link
              href="/login"
              className="btn btn-primary w-full py-2"
            >
              Follow
            </Link>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-edge mt-2">
          {(["posts", "saved", "liked"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium capitalize cursor-pointer transition-colors duration-150 ${
                activeTab === tab
                  ? "text-ink border-b-2 border-lamp"
                  : "text-ink-muted"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-4 pt-3">
          {activeTab === "posts" && <PostsTab posts={posts} />}
          {activeTab === "saved" && (
            <PrivateTabContent canSee={canSeePrivateContent} isOwnProfile={isOwnProfile} posts={savedPosts} lockedMessage="Follow to see saved posts" privateMessage="Saved posts are private" />
          )}
          {activeTab === "liked" && (
            <PrivateTabContent canSee={canSeePrivateContent} isOwnProfile={isOwnProfile} posts={likedPosts} lockedMessage="Follow to see liked posts" privateMessage="Liked posts are private" />
          )}
        </div>

        {/* Followers / Following bottom sheet */}
        {listOpen && (
          <div className="fixed inset-0 z-40 flex justify-center" onClick={() => setListOpen(null)}>
            <div className="absolute inset-0 bg-surface-0/70" />
            <div
              className="absolute bottom-0 w-full max-w-[430px] max-h-[70dvh] bg-surface-1 border-t border-edge rounded-t-sheet flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-edge">
                <p className="text-ink text-sm font-semibold capitalize">{listOpen}</p>
                <button onClick={() => setListOpen(null)} className="btn-icon" aria-label="Close">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto px-3 py-3 flex flex-col gap-1 pb-[max(env(safe-area-inset-bottom),12px)]">
                {listUsers === null ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : listUsers.length === 0 ? (
                  <p className="text-ink-muted text-sm text-center py-8">
                    {profile.is_private && profile.follow_status !== "accepted" && !isOwnProfile
                      ? "This account is private."
                      : "Nothing here yet."}
                  </p>
                ) : (
                  listUsers.map((u) => (
                    <Link
                      key={u.username}
                      href={`/profile/${u.username}`}
                      onClick={() => setListOpen(null)}
                      className="flex items-center gap-3 px-2 py-2 rounded-field hover:bg-surface-2 transition-colors duration-150"
                    >
                      <Avatar username={u.username} avatarUrl={u.avatar_url} size={40} verified={u.is_verified} />
                      <span className="flex items-center gap-1.5 text-ink text-sm font-medium">
                        @{u.username}
                        {u.is_verified > 0 && <VerifiedBadge size={14} level={u.is_verified} />}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <BottomNav activeTab="profile" />
      </div>
    </div>
  )
}

function PostList({ posts, emptyMessage }: { posts: Post[] | null; emptyMessage: string }) {
  if (posts === null) {
    return (
      <div className="flex justify-center pt-8">
        <Spinner />
      </div>
    )
  }
  if (posts.length === 0) {
    return <p className="text-ink-muted text-sm text-center pt-8">{emptyMessage}</p>
  }
  return (
    <div className="flex flex-col gap-2">
      {posts.map((post) => (
        <PostRow key={post.id} post={post} />
      ))}
    </div>
  )
}

function PostsTab({ posts }: { posts: Post[] | null }) {
  return <PostList posts={posts} emptyMessage="No posts yet." />
}

function PrivateTabContent({
  canSee,
  isOwnProfile,
  posts,
  lockedMessage,
  privateMessage,
}: {
  canSee: boolean
  isOwnProfile: boolean
  posts: Post[] | null
  lockedMessage: string
  privateMessage: string
}) {
  if (!canSee) {
    return <p className="text-ink-muted text-sm text-center pt-8">{lockedMessage}</p>
  }
  if (!isOwnProfile) {
    return <p className="text-ink-muted text-sm text-center pt-8">{privateMessage}</p>
  }
  return <PostList posts={posts} emptyMessage="Nothing here yet." />
}
