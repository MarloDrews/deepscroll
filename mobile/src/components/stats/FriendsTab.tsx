import { useEffect, useState } from "react"
import { FlatList, Pressable, Text, View } from "react-native"
import Svg, { Circle, Path } from "react-native-svg"
import { useRouter } from "expo-router"
import { apiFetch } from "../../lib/api"
import { FORMAT_IDS } from "../../lib/formats"
import { colors, fills, fonts } from "../../theme/tokens"
import { PulsingSlab, ghostPillStyle } from "../stage"
import { DEFAULT_COLOR, EMPTY_CELL, FORMAT_COLORS, LAMP, RANK_COLORS } from "./chartTheme"
import {
  GroupedVBarChart,
  HBarChart,
  NoData,
  PieChart,
  RadarChart,
  ScatterChart,
  TreemapChart,
} from "./charts"
import { DataTable, ProgressBarList, StatCardGrid } from "./widgets"
import CategorySection, { type ChartOption } from "./CategorySection"
import type { FriendStats } from "./types"

// Port of the web stats FriendsTab: fans out to /following then per-friend
// /elo + /profile (capped at 12, one failed friend never sinks the rest) and
// renders the same comparison sections. Mounted lazily by the stats route so
// the fan-out only runs when the tab is first visited.

function shortName(u: string, me: string): string {
  const label = u === me ? "You" : u
  return label.length > 12 ? label.slice(0, 11) + "…" : label
}

export default function FriendsTab({
  username,
  verifiedLevel,
  width,
}: {
  username: string
  verifiedLevel: number
  width: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [noFollowing, setNoFollowing] = useState(false)
  const [participants, setParticipants] = useState<FriendStats[]>([])

  const chartW = width - 56

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [followingData, myEloData, myProfileData] = await Promise.all([
          apiFetch(`/api/users/${username}/following`).then((r) => r.json()) as Promise<
            { username: string; is_verified: number }[]
          >,
          apiFetch(`/api/users/${username}/elo`).then((r) => r.json()) as Promise<{
            global_rating: number | null
            formats: Record<string, { rating: number; answered_count: number }>
          }>,
          apiFetch(`/api/users/${username}/profile`).then((r) => r.json()) as Promise<{
            post_count: number
            follower_count: number
            following_count: number
          }>,
        ])
        if (cancelled) return

        if (followingData.length === 0) {
          setNoFollowing(true)
          return
        }

        const me: FriendStats = {
          username,
          is_verified: verifiedLevel,
          global_rating: myEloData.global_rating,
          formats: myEloData.formats,
          post_count: myProfileData.post_count,
          follower_count: myProfileData.follower_count,
          following_count: myProfileData.following_count,
        }

        const friendList = (
          await Promise.all(
            followingData.slice(0, 12).map(async (u) => {
              try {
                const [eloData, profileData] = await Promise.all([
                  apiFetch(`/api/users/${u.username}/elo`).then((r) => r.json()),
                  apiFetch(`/api/users/${u.username}/profile`).then((r) => r.json()),
                ])
                return {
                  username: u.username,
                  is_verified: u.is_verified,
                  global_rating: eloData.global_rating,
                  formats: eloData.formats,
                  post_count: profileData.post_count,
                  follower_count: profileData.follower_count,
                  following_count: profileData.following_count,
                } satisfies FriendStats
              } catch {
                return null
              }
            })
          )
        ).filter((f): f is FriendStats => f !== null)

        if (!cancelled) setParticipants([me, ...friendList])
      } catch {
        // leave empty state
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [username, verifiedLevel])

  if (loading) {
    return (
      <View style={{ paddingHorizontal: 12, paddingTop: 8, gap: 12 }}>
        <PulsingSlab height={160} />
        <PulsingSlab height={256} />
      </View>
    )
  }

  if (noFollowing || participants.length === 0) {
    return (
      <View style={{ alignItems: "center", paddingHorizontal: 32, paddingVertical: 64, gap: 16 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: fills.chrome,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={colors["ink-muted"]} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx={9} cy={7} r={4} stroke={colors["ink-muted"]} strokeWidth={1.5} />
            <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={colors["ink-muted"]} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={colors["ink-muted"]} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors["ink-body"] }}>No friends yet</Text>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 12,
            lineHeight: 18,
            color: colors["ink-muted"],
            textAlign: "center",
            maxWidth: 220,
          }}
        >
          Follow people to compare your knowledge scores and activity with them.
        </Text>
        <Pressable
          onPress={() => router.push("/search")}
          style={({ pressed }) => [ghostPillStyle, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
        >
          <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: colors["ink-body"] }}>
            Find people to follow
          </Text>
        </Pressable>
      </View>
    )
  }

  const friends = participants.filter((p) => p.username !== username)
  const me = participants.find((p) => p.username === username)!
  const eloMax = Math.max(1600, ...participants.map((p) => p.global_rating ?? 0))

  const sorted = (getter: (p: FriendStats) => number) =>
    [...participants].sort((a, b) => getter(b) - getter(a))

  const isMe = (p: FriendStats) => p.username === username
  const barColor = (p: FriendStats) => (isMe(p) ? LAMP : DEFAULT_COLOR)

  const totalAnswers = (p: FriendStats) =>
    Object.values(p.formats).reduce((s, f) => s + (f.answered_count ?? 0), 0)
  const eloEfficiency = (p: FriendStats): number => {
    const total = totalAnswers(p)
    return total > 0 && p.global_rating !== null ? Math.round((p.global_rating / total) * 10) / 10 : 0
  }
  const breadth = (p: FriendStats) =>
    Object.values(p.formats).filter((f) => (f.answered_count ?? 0) > 0).length

  // ------- 1. Knowledge Leaderboard -------
  const eloSorted = sorted((p) => p.global_rating ?? 0).filter((p) => p.global_rating !== null)

  // ------- 2. Per-format Elo -------
  const perFormatRows = FORMAT_IDS.map((fmt) => {
    const myRating = me.formats[fmt]?.rating ?? 0
    const friendRatings = friends.map((f) => f.formats[fmt]?.rating ?? 0).filter((r) => r > 0)
    const friendAvg =
      friendRatings.length > 0
        ? Math.round(friendRatings.reduce((a, b) => a + b, 0) / friendRatings.length)
        : 0
    return { format: fmt, you: Math.round(myRating), friends_avg: friendAvg }
  }).filter((d) => d.you > 0 || d.friends_avg > 0)

  const formatLeadershipGrid = () => {
    const panels = FORMAT_IDS.map((fmt) => {
      const inFmt = participants
        .filter((p) => (p.formats[fmt]?.rating ?? 0) > 0)
        .sort((a, b) => (b.formats[fmt]?.rating ?? 0) - (a.formats[fmt]?.rating ?? 0))
      if (inFmt.length === 0) return null
      const top = inFmt[0]
      return (
        <View
          key={fmt}
          style={{ flexBasis: "47%", flexGrow: 1, backgroundColor: fills.slab, borderRadius: 12, padding: 12 }}
        >
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 10, color: FORMAT_COLORS[fmt], marginBottom: 8 }}>
            {fmt}
          </Text>
          {inFmt.slice(0, 3).map((p, i) => (
            <View key={p.username} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <View
                style={{
                  height: 6,
                  borderRadius: 2,
                  width: Math.max(((p.formats[fmt]?.rating ?? 0) / (top.formats[fmt]?.rating || 1)) * 56, 4),
                  backgroundColor: isMe(p) ? LAMP : FORMAT_COLORS[fmt],
                  opacity: 1 - i * 0.25,
                }}
              />
              <Text
                numberOfLines={1}
                style={{
                  flexShrink: 1,
                  fontFamily: isMe(p) ? fonts.sansSemiBold : fonts.sans,
                  fontSize: 9,
                  color: isMe(p) ? colors.lamp : colors["ink-dim"],
                }}
              >
                {shortName(p.username, username)}
              </Text>
              <Text style={{ marginLeft: "auto", fontFamily: fonts.mono, fontSize: 9, color: colors["ink-muted"] }}>
                {Math.round(p.formats[fmt]?.rating ?? 0)}
              </Text>
            </View>
          ))}
        </View>
      )
    }).filter(Boolean)
    if (panels.length === 0) return <NoData />
    return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>{panels}</View>
  }

  // ------- 3. Quiz Activity -------
  const quizSorted = sorted(totalAnswers)
  const quizByFormat = FORMAT_IDS.map((fmt) => {
    const myCount = me.formats[fmt]?.answered_count ?? 0
    const counts = friends.map((f) => f.formats[fmt]?.answered_count ?? 0).filter((c) => c > 0)
    const friendAvg = counts.length > 0 ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length) : 0
    return { format: fmt, you: myCount, friends_avg: friendAvg }
  }).filter((d) => d.you > 0 || d.friends_avg > 0)

  // ------- 4. Efficiency / 5. Breadth / 6. Content / 7. Social -------
  const effSorted = sorted(eloEfficiency)
  const breadthSorted = sorted(breadth)
  const postSorted = sorted((p) => p.post_count)
  const followerSorted = sorted((p) => p.follower_count)

  const breadthGrid = () => (
    <View style={{ gap: 12 }}>
      {breadthSorted.map((p) => (
        <View key={p.username} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            numberOfLines={1}
            style={{
              width: 72,
              fontFamily: isMe(p) ? fonts.sansSemiBold : fonts.sans,
              fontSize: 12,
              color: isMe(p) ? colors.lamp : colors["ink-dim"],
            }}
          >
            {shortName(p.username, username)}
          </Text>
          <View style={{ flexDirection: "row", gap: 2 }}>
            {FORMAT_IDS.map((fmt) => {
              const hasAnswers = (p.formats[fmt]?.answered_count ?? 0) > 0
              return (
                <View
                  key={fmt}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 2,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: hasAnswers ? FORMAT_COLORS[fmt] + "55" : EMPTY_CELL,
                    borderWidth: 1,
                    borderColor: hasAnswers ? FORMAT_COLORS[fmt] + "80" : colors["surface-3"],
                  }}
                >
                  {hasAnswers && (
                    <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 7, color: FORMAT_COLORS[fmt] }}>
                      {fmt[0].toUpperCase()}
                    </Text>
                  )}
                </View>
              )
            })}
          </View>
          <Text style={{ marginLeft: "auto", fontFamily: fonts.mono, fontSize: 12, color: colors["ink-body"] }}>
            {breadth(p)}/{FORMAT_IDS.length}
          </Text>
        </View>
      ))}
    </View>
  )

  const overviewItems = (() => {
    const friendElos = friends.map((f) => f.global_rating).filter((r): r is number => r !== null)
    const friendAvgElo =
      friendElos.length > 0 ? Math.round(friendElos.reduce((a, b) => a + b, 0) / friendElos.length) : null
    const friendAvgAnswers =
      friends.length > 0 ? Math.round(friends.reduce((s, f) => s + totalAnswers(f), 0) / friends.length) : 0
    const friendAvgPosts =
      friends.length > 0 ? Math.round(friends.reduce((s, f) => s + f.post_count, 0) / friends.length) : 0
    return [
      { label: "Your Global Elo", value: me.global_rating !== null ? Math.round(me.global_rating) : "—" },
      { label: "Friends Avg Elo", value: friendAvgElo !== null ? friendAvgElo : "—" },
      { label: "Your Quiz Answers", value: totalAnswers(me) },
      { label: "Friends Avg Answers", value: friendAvgAnswers },
      { label: "Your Posts", value: me.post_count },
      { label: "Friends Avg Posts", value: friendAvgPosts },
      { label: "Friends Following", value: friends.length },
      { label: "Your Breadth", value: `${breadth(me)}/${FORMAT_IDS.length}` },
    ]
  })()

  const sections: { title: string; charts: ChartOption[] }[] = [
    {
      title: "Overview",
      charts: [{ label: "Cards", render: () => <StatCardGrid items={overviewItems} /> }],
    },
    {
      title: "Knowledge Leaderboard (Global Elo)",
      charts: [
        {
          label: "Progress bars",
          render: () =>
            eloSorted.length === 0 ? (
              <NoData />
            ) : (
              <ProgressBarList
                items={eloSorted.map((p) => ({
                  label: shortName(p.username, username),
                  value: p.global_rating ?? 0,
                  max: eloMax,
                  color: barColor(p),
                  display: p.global_rating !== null ? String(Math.round(p.global_rating)) : "—",
                  highlight: isMe(p),
                }))}
              />
            ),
        },
        {
          label: "Horizontal bar",
          render: () => (
            <HBarChart
              data={eloSorted.map((p) => ({
                label: shortName(p.username, username),
                value: Math.round(p.global_rating ?? 0),
                color: barColor(p),
              }))}
              width={chartW}
            />
          ),
        },
        {
          label: "Table",
          render: () => (
            <DataTable
              columns={[
                { label: "#", flex: 0.5 },
                { label: "User", flex: 3 },
                { label: "Global Elo", flex: 1.5, align: "right" },
              ]}
              rows={eloSorted.map((p, i) => [
                String(i + 1),
                shortName(p.username, username),
                String(Math.round(p.global_rating ?? 0)),
              ])}
            />
          ),
        },
        {
          label: "Scatter",
          render: () =>
            eloSorted.length === 0 ? (
              <NoData />
            ) : (
              <ScatterChart
                data={eloSorted.map((p, i) => ({
                  x: i + 1,
                  y: Math.round(p.global_rating ?? 0),
                  color: barColor(p),
                }))}
                width={chartW}
              />
            ),
        },
      ],
    },
    {
      title: "Per-format Elo",
      charts: [
        {
          label: "Radar",
          render: () =>
            perFormatRows.length === 0 ? (
              <NoData />
            ) : (
              <RadarChart
                axes={perFormatRows.map((d) => d.format)}
                series={[
                  { name: "You", color: LAMP, values: perFormatRows.map((d) => d.you), fillOpacity: 0.3 },
                  {
                    name: "Friends avg",
                    color: DEFAULT_COLOR,
                    values: perFormatRows.map((d) => d.friends_avg),
                    fillOpacity: 0.15,
                  },
                ]}
                width={chartW}
                height={240}
              />
            ),
        },
        {
          label: "Grouped bar",
          render: () =>
            perFormatRows.length === 0 ? (
              <NoData />
            ) : (
              <GroupedVBarChart
                data={perFormatRows.map((d) => ({ label: d.format, values: [d.you, d.friends_avg] }))}
                series={[
                  { name: "You", color: LAMP },
                  { name: "Friends avg", color: DEFAULT_COLOR },
                ]}
                width={chartW}
              />
            ),
        },
        { label: "Format leaders", render: formatLeadershipGrid },
      ],
    },
    {
      title: "Quiz Activity",
      charts: [
        {
          label: "Total answers",
          render: () => (
            <HBarChart
              data={quizSorted.map((p) => ({
                label: shortName(p.username, username),
                value: totalAnswers(p),
                color: barColor(p),
              }))}
              width={chartW}
            />
          ),
        },
        {
          label: "By format (bar)",
          render: () =>
            quizByFormat.length === 0 ? (
              <NoData />
            ) : (
              <GroupedVBarChart
                data={quizByFormat.map((d) => ({ label: d.format, values: [d.you, d.friends_avg] }))}
                series={[
                  { name: "You", color: LAMP },
                  { name: "Friends avg", color: DEFAULT_COLOR },
                ]}
                width={chartW}
              />
            ),
        },
        {
          label: "By format (radar)",
          render: () =>
            quizByFormat.length === 0 ? (
              <NoData />
            ) : (
              <RadarChart
                axes={quizByFormat.map((d) => d.format)}
                series={[
                  { name: "You", color: LAMP, values: quizByFormat.map((d) => d.you), fillOpacity: 0.3 },
                  {
                    name: "Friends avg",
                    color: DEFAULT_COLOR,
                    values: quizByFormat.map((d) => d.friends_avg),
                    fillOpacity: 0.15,
                  },
                ]}
                width={chartW}
                height={240}
              />
            ),
        },
      ],
    },
    {
      title: "Knowledge Efficiency (Elo per Answer)",
      charts: [
        {
          label: "Horizontal bar",
          render: () => (
            <HBarChart
              data={effSorted.map((p) => ({
                label: shortName(p.username, username),
                value: eloEfficiency(p),
                color: barColor(p),
              }))}
              width={chartW}
            />
          ),
        },
        {
          label: "Table",
          render: () => (
            <DataTable
              columns={[
                { label: "#", flex: 0.5 },
                { label: "User", flex: 2.4 },
                { label: "Elo", flex: 1.2, align: "right" },
                { label: "Answers", flex: 1.4, align: "right" },
                { label: "Elo/ans", flex: 1.3, align: "right" },
              ]}
              rows={effSorted.map((p, i) => [
                String(i + 1),
                shortName(p.username, username),
                p.global_rating !== null ? String(Math.round(p.global_rating)) : "—",
                String(totalAnswers(p)),
                String(eloEfficiency(p)),
              ])}
            />
          ),
        },
      ],
    },
    {
      title: "Knowledge Breadth (Formats Explored)",
      charts: [
        { label: "Format grid", render: breadthGrid },
        {
          label: "Donut",
          render: () => {
            const friendAvgBreadth =
              friends.length > 0
                ? Math.round(friends.reduce((s, f) => s + breadth(f), 0) / friends.length)
                : 0
            const d = [
              { label: "You", value: breadth(me), color: LAMP },
              { label: "Friends avg", value: friendAvgBreadth, color: DEFAULT_COLOR },
            ].filter((x) => x.value > 0)
            if (d.length === 0) return <NoData />
            return (
              <View style={{ alignItems: "center", gap: 8 }}>
                <PieChart data={d} width={chartW} height={180} innerRatio={0.5} />
                <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-muted"] }}>
                  Formats explored (out of {FORMAT_IDS.length})
                </Text>
              </View>
            )
          },
        },
      ],
    },
    {
      title: "Content Created",
      charts: [
        {
          label: "Horizontal bar",
          render: () => (
            <HBarChart
              data={postSorted.map((p) => ({
                label: shortName(p.username, username),
                value: p.post_count,
                color: barColor(p),
              }))}
              width={chartW}
            />
          ),
        },
        {
          label: "Table",
          render: () => (
            <DataTable
              columns={[
                { label: "#", flex: 0.5 },
                { label: "User", flex: 3 },
                { label: "Posts", flex: 1.5, align: "right" },
              ]}
              rows={postSorted.map((p, i) => [
                String(i + 1),
                shortName(p.username, username),
                String(p.post_count),
              ])}
            />
          ),
        },
        {
          label: "Treemap",
          render: () => (
            <TreemapChart
              data={postSorted.map((p, i) => ({
                label: shortName(p.username, username),
                value: Math.max(p.post_count, 1),
                color: isMe(p) ? LAMP : RANK_COLORS[i] ?? DEFAULT_COLOR,
              }))}
              width={chartW}
            />
          ),
        },
      ],
    },
    {
      title: "Social",
      charts: [
        {
          label: "Followers",
          render: () => (
            <HBarChart
              data={followerSorted.map((p) => ({
                label: shortName(p.username, username),
                value: p.follower_count,
                color: barColor(p),
              }))}
              width={chartW}
            />
          ),
        },
        {
          label: "Followers & Following",
          render: () => (
            <GroupedVBarChart
              data={participants.map((p) => ({
                label: shortName(p.username, username),
                values: [p.follower_count, p.following_count],
              }))}
              series={[
                { name: "Followers", color: LAMP },
                { name: "Following", color: DEFAULT_COLOR },
              ]}
              width={chartW}
            />
          ),
        },
      ],
    },
  ]

  return (
    <FlatList
      data={sections}
      keyExtractor={(s) => s.title}
      renderItem={({ item }) => <CategorySection title={item.title} charts={item.charts} />}
      initialNumToRender={4}
      maxToRenderPerBatch={3}
      windowSize={21}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 4, paddingBottom: 120 }}
    />
  )
}
