import { FlatList, Text, View } from "react-native"
import Svg, { Path } from "react-native-svg"
import { colors, fills, fonts } from "../../theme/tokens"
import { DEFAULT_COLOR, FORMATS, FORMAT_COLORS, LAMP } from "./chartTheme"
import {
  AreaChart,
  DualLineChart,
  HBarChart,
  LineChart,
  NoData,
  PieChart,
  RadarChart,
  ScatterChart,
  VBarChart,
} from "./charts"
import {
  ActivityHeatmap,
  CalendarHeatmap,
  DataTable,
  FormatChip,
  GaugeChart,
  ProgressBarList,
  StatCardGrid,
  WaffleChart,
} from "./widgets"
import CategorySection, { type ChartOption } from "./CategorySection"
import type { MyStats } from "./types"

// Port of the web stats MyStatsTab: the same 17 categories rebuilt on the
// RN chart kit. The web streak cards use a fire emoji; here it is a small
// flame glyph (the BottomNav feed path) since the project bans emojis.

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "…" : s
}

function Flame() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"
        stroke={colors.save}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default function MyStatsTab({
  data,
  savedCount,
  width,
}: {
  data: MyStats
  savedCount: number
  width: number
}) {
  const chartW = width - 56
  const { overview } = data

  const overTime = (
    series: { period: string; count: number }[],
    color: string
  ): ChartOption[] => {
    const d = series.map((r) => ({ label: r.period, value: r.count }))
    return [
      { label: "Line", render: () => <LineChart data={d} color={color} width={chartW} /> },
      { label: "Area", render: () => <AreaChart data={d} color={color} width={chartW} /> },
      { label: "Bar", render: () => <VBarChart data={d.map((x) => ({ ...x, color }))} width={chartW} /> },
    ]
  }

  // Format-keyed array sections share donut / horizontal bar / radar views.
  const formatArrCharts = (arr: { format: string; count: number }[]): ChartOption[] => {
    const d = arr.map((x) => ({
      label: x.format,
      value: x.count,
      color: FORMAT_COLORS[x.format] ?? DEFAULT_COLOR,
    }))
    return [
      { label: "Donut", render: () => <PieChart data={d} width={chartW} innerRatio={0.55} /> },
      { label: "Horizontal Bar", render: () => <HBarChart data={d} width={chartW} /> },
      {
        label: "Radar",
        render: () => (
          <RadarChart
            axes={arr.map((x) => x.format)}
            series={[{ name: "count", color: LAMP, values: arr.map((x) => x.count) }]}
            width={chartW}
          />
        ),
      },
    ]
  }

  const topPostCharts = (
    rows: { post_id: number; title: string; format: string; value: number }[],
    color: string,
    valueLabel: string
  ): ChartOption[] => [
    {
      label: "Horizontal Bar",
      render: () => (
        <HBarChart
          data={rows.map((r) => ({ label: truncate(r.title, 14), value: r.value, color }))}
          width={chartW}
        />
      ),
    },
    {
      label: "Table",
      render: () => (
        <DataTable
          columns={[
            { label: "Title", flex: 3 },
            { label: "Format", flex: 1.8 },
            { label: valueLabel, flex: 1.2, align: "right" },
          ]}
          rows={rows.map((r) => [
            truncate(r.title, 24),
            <FormatChip key={r.post_id} format={r.format} />,
            String(r.value),
          ])}
        />
      ),
    },
  ]

  // 1b. Knowledge score: stat cards + per-format Elo progress bars.
  const eloFormats = Object.entries(data.my_elo.formats)
  const eloMax = Math.max(1600, ...eloFormats.map(([, d]) => d.rating))
  const knowledgeBlock = () => (
    <View style={{ gap: 16 }}>
      <StatCardGrid
        items={[
          { label: "Global Score", value: data.my_elo.global_rating ?? "—" },
          { label: "Answered", value: data.my_quiz.answered },
          { label: "Accuracy", value: `${data.my_quiz.accuracy}%` },
        ]}
      />
      {eloFormats.length === 0 ? (
        <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-muted"] }}>
          Answer post quizzes or train to build your score. Correct answers raise it, wrong answers lower it.
        </Text>
      ) : (
        <ProgressBarList
          items={eloFormats.map(([fmt, d]) => ({
            label: fmt,
            value: d.rating,
            max: eloMax,
            color: FORMAT_COLORS[fmt] ?? DEFAULT_COLOR,
            display: String(Math.round(d.rating)),
          }))}
        />
      )}
    </View>
  )

  const myPostsByFormatArr = FORMATS.map((f) => ({
    format: f,
    count: data.my_posts_by_format[f] ?? 0,
  }))

  const commentsWrittenByFormat = FORMATS.map((f) => ({
    format: f,
    count: data.my_comments_written_by_format.find((d) => d.format === f)?.count ?? 0,
  }))

  const likedByFormatFull = FORMATS.map((f) => ({
    format: f,
    count: data.my_likes_given_by_format.find((d) => d.format === f)?.count ?? 0,
  }))
  const likedByFormatHasData = likedByFormatFull.some((d) => d.count > 0)

  const readTimeArr = data.my_avg_read_time_per_format.map((d) => ({
    format: d.format,
    avg_sec: Math.round(d.avg_duration_ms / 100) / 10,
  }))
  const readTimeCharts: ChartOption[] = [
    {
      label: "Horizontal Bar",
      render: () => (
        <HBarChart
          data={readTimeArr.map((d) => ({
            label: d.format,
            value: d.avg_sec,
            color: FORMAT_COLORS[d.format] ?? DEFAULT_COLOR,
          }))}
          width={chartW}
          unit="s"
        />
      ),
    },
    {
      label: "Radar",
      render: () => (
        <RadarChart
          axes={readTimeArr.map((d) => d.format)}
          series={[{ name: "avg_sec", color: "#5bc8bc", values: readTimeArr.map((d) => d.avg_sec) }]}
          width={chartW}
        />
      ),
    },
  ]

  const readTimeOverTime = data.my_avg_read_time_over_time.map((d) => ({
    label: d.period,
    value: Math.round(d.avg_duration_ms / 100) / 10,
  }))

  const weekdayDatums = data.my_activity_by_weekday.map((d) => ({ label: d.weekday, value: d.count }))
  const hourDatums = data.my_activity_by_hour.map((d) => ({ label: String(d.hour), value: d.count }))

  const { by_posts, by_likes, total_users } = data.my_ranking
  const score = data.my_engagement_score
  const { current_days, best_days } = data.my_streak

  const streakCard = (value: number, label: string) => (
    <View
      style={{
        flex: 1,
        backgroundColor: fills.slab,
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        gap: 4,
      }}
    >
      <Text style={{ fontFamily: fonts.mono, fontSize: 32, color: colors.ink }}>{value}</Text>
      <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-dim"] }}>{label}</Text>
      <Flame />
    </View>
  )

  const milestonesTimeline = () => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 16 }}>
      {data.my_milestones.map((m) => (
        <View key={m.label} style={{ width: "25%", alignItems: "center", gap: 6, paddingHorizontal: 2 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: m.achieved ? colors.lamp : "transparent",
              backgroundColor: m.achieved ? "rgba(124, 111, 255, 0.2)" : fills.chrome,
            }}
          >
            <Text style={{ fontSize: 13, color: m.achieved ? colors.lamp : colors["ink-faint"] }}>
              {m.achieved ? "✓" : "○"}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 10,
              lineHeight: 13,
              textAlign: "center",
              color: m.achieved ? colors["ink-body"] : colors["ink-faint"],
            }}
          >
            {m.label}
          </Text>
          {m.achieved_at && (
            <Text style={{ fontFamily: fonts.mono, fontSize: 9, color: colors["ink-faint"] }}>
              {m.achieved_at}
            </Text>
          )}
        </View>
      ))}
    </View>
  )

  const sections: { title: string; charts: ChartOption[] }[] = [
    {
      title: "Overview",
      charts: [
        {
          label: "Cards",
          render: () => (
            <StatCardGrid
              items={[
                { label: "Posts Created", value: overview.posts_created },
                { label: "Published", value: overview.posts_published },
                { label: "Pending", value: overview.posts_pending },
                { label: "Likes Received", value: overview.likes_received },
                { label: "Comments Received", value: overview.comments_received },
                { label: "Posts Liked", value: overview.posts_liked },
                { label: "Saved Posts", value: savedCount >= 0 ? savedCount : "—" },
              ]}
            />
          ),
        },
      ],
    },
    { title: "My Knowledge Score", charts: [{ label: "Score", render: knowledgeBlock }] },
    {
      title: "My Posts over Time",
      charts: [
        ...overTime(data.my_posts_over_time, LAMP),
        {
          label: "Cumulative",
          render: () => (
            <AreaChart
              data={data.my_posts_over_time.map((r) => ({ label: r.period, value: r.count }))}
              color={LAMP}
              width={chartW}
              cumulative
            />
          ),
        },
        { label: "Calendar", render: () => <CalendarHeatmap data={data.my_posts_over_time} /> },
      ],
    },
    {
      title: "My Likes Received over Time",
      charts: [
        ...overTime(data.my_likes_received_over_time, "#c47dcc"),
        {
          label: "Overlay",
          render: () => (
            <DualLineChart
              data={data.my_posts_over_time.map((r, i) => ({
                label: r.period,
                a: r.count,
                b: data.my_likes_received_over_time[i]?.count ?? 0,
              }))}
              seriesA={{ name: "posts", color: LAMP }}
              seriesB={{ name: "likes", color: "#c47dcc" }}
              width={chartW}
            />
          ),
        },
      ],
    },
    {
      title: "My Comments Received over Time",
      charts: overTime(data.my_comments_received_over_time, "#72bb80"),
    },
    {
      title: "When Am I Active?",
      charts: [
        { label: "Heatmap", render: () => <ActivityHeatmap data={data.my_activity_heatmap} width={chartW} /> },
        {
          label: "Polar",
          render: () => (
            <RadarChart
              axes={weekdayDatums.map((d) => d.label)}
              series={[{ name: "count", color: LAMP, values: weekdayDatums.map((d) => d.value) }]}
              width={chartW}
            />
          ),
        },
        { label: "By Weekday", render: () => <VBarChart data={weekdayDatums.map((d) => ({ ...d, color: LAMP }))} width={chartW} /> },
        { label: "By Hour", render: () => <VBarChart data={hourDatums.map((d) => ({ ...d, color: "#5bc8bc" }))} width={chartW} /> },
      ],
    },
    {
      title: "My Posts by Format",
      charts: [
        ...formatArrCharts(myPostsByFormatArr).slice(0, 1),
        {
          label: "Vertical Bar",
          render: () => (
            <VBarChart
              data={myPostsByFormatArr.map((d) => ({
                label: d.format,
                value: d.count,
                color: FORMAT_COLORS[d.format] ?? DEFAULT_COLOR,
              }))}
              width={chartW}
            />
          ),
        },
        ...formatArrCharts(myPostsByFormatArr).slice(1),
        {
          label: "Waffle",
          render: () => (
            <WaffleChart
              data={myPostsByFormatArr.map((d) => ({
                label: d.format,
                value: d.count,
                color: FORMAT_COLORS[d.format] ?? DEFAULT_COLOR,
              }))}
              width={chartW}
            />
          ),
        },
      ],
    },
    {
      title: "My Avg Read Time per Format",
      charts: [
        ...readTimeCharts,
        {
          label: "Dot Plot",
          render: () => (
            <ScatterChart
              data={readTimeArr.map((d, i) => ({ x: i + 1, y: d.avg_sec, color: "#5bc8bc" }))}
              width={chartW}
              unit="s"
            />
          ),
        },
      ],
    },
    {
      title: "My Avg Read Time over Time",
      charts: [
        { label: "Line", render: () => <LineChart data={readTimeOverTime} color="#5bc8bc" width={chartW} unit="s" /> },
        { label: "Area", render: () => <AreaChart data={readTimeOverTime} color="#5bc8bc" width={chartW} unit="s" /> },
        { label: "Bar", render: () => <VBarChart data={readTimeOverTime.map((d) => ({ ...d, color: "#5bc8bc" }))} width={chartW} unit="s" /> },
      ],
    },
    {
      title: "My Top Posts by Likes",
      charts: topPostCharts(
        data.my_top_posts_by_likes.map((r) => ({ ...r, value: r.like_count })),
        "#c47dcc",
        "Likes"
      ),
    },
    {
      title: "My Top Posts by Comments",
      charts: topPostCharts(
        data.my_top_posts_by_comments.map((r) => ({ ...r, value: r.comment_count })),
        "#72bb80",
        "Comments"
      ),
    },
    { title: "My Comments Written by Format", charts: formatArrCharts(commentsWrittenByFormat) },
    {
      title: "My Ranking",
      charts: [
        {
          label: "Gauge",
          render: () => (
            <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
              <View style={{ alignItems: "center", gap: 4 }}>
                <GaugeChart value={total_users - by_posts + 1} max={total_users} label="Posts rank" color={LAMP} size={140} />
                <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-dim"] }}>
                  #{by_posts} of {total_users}
                </Text>
              </View>
              <View style={{ alignItems: "center", gap: 4 }}>
                <GaugeChart value={total_users - by_likes + 1} max={total_users} label="Likes rank" color="#c47dcc" size={140} />
                <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-dim"] }}>
                  #{by_likes} of {total_users}
                </Text>
              </View>
            </View>
          ),
        },
      ],
    },
    {
      title: "My Engagement Score",
      charts: [
        {
          label: "Gauge",
          render: () => (
            <View style={{ alignItems: "center", gap: 8 }}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 36, color: colors.ink }}>{score.toFixed(1)}</Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors["ink-muted"] }}>out of 100</Text>
              <GaugeChart value={score} max={100} label="Engagement" color={LAMP} size={180} />
            </View>
          ),
        },
        {
          label: "Approximation",
          render: () => (
            <LineChart
              data={data.my_posts_over_time.map((r) => ({
                label: r.period,
                value: Math.min(r.count * 5, 100),
              }))}
              color={LAMP}
              width={chartW}
            />
          ),
        },
      ],
    },
    {
      title: "My Streak",
      charts: [
        {
          label: "Cards",
          render: () => (
            <View style={{ flexDirection: "row", gap: 16 }}>
              {streakCard(current_days, "Current streak")}
              {streakCard(best_days, "Best streak")}
            </View>
          ),
        },
      ],
    },
    { title: "My Milestones", charts: [{ label: "Timeline", render: milestonesTimeline }] },
    {
      title: "My Likes Given by Format",
      charts: likedByFormatHasData
        ? formatArrCharts(likedByFormatFull)
        : [{ label: "Donut", render: () => <NoData /> }],
    },
    {
      title: "My Scroll Behavior (Avg View Duration)",
      charts: readTimeCharts,
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
