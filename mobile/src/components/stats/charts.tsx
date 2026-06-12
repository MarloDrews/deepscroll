import { Text, View } from "react-native"
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Polyline,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg"
import { colors, fonts } from "../../theme/tokens"
import {
  AXIS_COLOR,
  AXIS_FONT_SIZE,
  DEFAULT_COLOR,
  GRID_COLOR,
  INK,
  niceMax,
} from "./chartTheme"

// Stage chart kit on react-native-svg, replacing the recharts charts of the
// web stats page (bar/line/area/pie/radar/scatter/treemap). Charts are
// static — no tooltips (no hover on mobile); exact values live in the Table
// and Progress chart options. Every chart takes an explicit pixel width
// (measured once by the stats route) so no chart needs its own onLayout.

export interface Datum {
  label: string
  value: number
  color?: string
}

// --- shared internals ---

const M = { top: 8, right: 12, bottom: 20, left: 36 }

function yTicks(max: number, n = 4): number[] {
  return Array.from({ length: n + 1 }, (_, i) => (max / n) * i)
}

function tickLabel(v: number): string {
  if (v >= 1000) return `${Math.round(v / 100) / 10}k`
  return v % 1 === 0 ? String(v) : v.toFixed(1)
}

// Time-series x labels come as "YYYY-MM"; the web shows v.slice(5).
function periodLabel(label: string): string {
  return label.length >= 7 && label[4] === "-" ? label.slice(5) : label
}

// Horizontal grid lines + y tick labels for cartesian charts.
function CartesianFrame({
  width,
  height,
  max,
  unit = "",
}: {
  width: number
  height: number
  max: number
  unit?: string
}) {
  const plotH = height - M.top - M.bottom
  return (
    <>
      {yTicks(max).map((t, i) => {
        const y = M.top + plotH - (t / max) * plotH
        return (
          <Line
            key={`g${i}`}
            x1={M.left}
            y1={y}
            x2={width - M.right}
            y2={y}
            stroke={GRID_COLOR}
            strokeDasharray="3 3"
          />
        )
      })}
      {yTicks(max).map((t, i) => {
        const y = M.top + plotH - (t / max) * plotH
        return (
          <SvgText
            key={`t${i}`}
            x={M.left - 5}
            y={y + 3.5}
            textAnchor="end"
            fill={AXIS_COLOR}
            fontSize={AXIS_FONT_SIZE}
            fontFamily={fonts.mono}
          >
            {tickLabel(t) + unit}
          </SvgText>
        )
      })}
    </>
  )
}

// Sparse x labels under the plot (every nth so ~6 fit).
function XLabels({
  labels,
  width,
  height,
  angled,
}: {
  labels: string[]
  width: number
  height: number
  angled?: boolean
}) {
  const plotW = width - M.left - M.right
  const step = Math.max(1, Math.ceil(labels.length / (angled ? labels.length : 6)))
  return (
    <>
      {labels.map((label, i) => {
        if (i % step !== 0) return null
        const x = M.left + (labels.length === 1 ? plotW / 2 : (i / (labels.length - 1)) * plotW)
        const y = height - 6
        return (
          <SvgText
            key={i}
            x={x}
            y={y}
            textAnchor={angled ? "end" : "middle"}
            transform={angled ? `rotate(-35 ${x} ${y})` : undefined}
            fill={AXIS_COLOR}
            fontSize={AXIS_FONT_SIZE}
            fontFamily={fonts.sans}
          >
            {label}
          </SvgText>
        )
      })}
    </>
  )
}

function LegendRow({ items }: { items: { name: string; color: string }[] }) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 12,
        marginTop: 6,
      }}
    >
      {items.map((item) => (
        <View key={item.name} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: item.color }} />
          <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: AXIS_COLOR }}>{item.name}</Text>
        </View>
      ))}
    </View>
  )
}

export function NoData() {
  return (
    <View style={{ height: 64, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors["ink-faint"] }}>No data yet</Text>
    </View>
  )
}

// --- Horizontal bar chart ---
// Category labels left, value labels at the bar end (replaces the web
// tooltip for exact numbers). Height grows with the row count.

export function HBarChart({
  data,
  width,
  unit = "",
}: {
  data: Datum[]
  width: number
  unit?: string
}) {
  if (data.length === 0) return <NoData />
  const rowH = 30
  const labelW = 76
  const valueW = 40
  const height = data.length * rowH + 8
  const plotW = width - labelW - valueW
  const max = niceMax(Math.max(...data.map((d) => d.value), 0))
  return (
    <Svg width={width} height={height}>
      {data.map((d, i) => {
        const y = i * rowH + 4
        const barW = Math.max((d.value / max) * plotW, d.value > 0 ? 3 : 0)
        const label = d.label.length > 10 ? d.label.slice(0, 9) + "…" : d.label
        return (
          <G key={`${d.label}-${i}`}>
            <SvgText
              x={labelW - 6}
              y={y + rowH / 2 + 1}
              textAnchor="end"
              fill={AXIS_COLOR}
              fontSize={AXIS_FONT_SIZE}
              fontFamily={fonts.sans}
            >
              {label}
            </SvgText>
            <Rect
              x={labelW}
              y={y + 5}
              width={barW}
              height={rowH - 14}
              rx={3}
              fill={d.color ?? DEFAULT_COLOR}
            />
            <SvgText
              x={labelW + barW + 5}
              y={y + rowH / 2 + 1}
              fill={colors["ink-body"]}
              fontSize={AXIS_FONT_SIZE}
              fontFamily={fonts.mono}
            >
              {tickLabel(d.value) + unit}
            </SvgText>
          </G>
        )
      })}
    </Svg>
  )
}

// --- Vertical bar chart ---

export function VBarChart({
  data,
  width,
  height = 200,
  angled,
  unit = "",
}: {
  data: Datum[]
  width: number
  height?: number
  angled?: boolean
  unit?: string
}) {
  if (data.length === 0) return <NoData />
  const h = angled ? height + 24 : height
  const plotW = width - M.left - M.right
  const plotH = h - M.top - M.bottom - (angled ? 24 : 0)
  const max = niceMax(Math.max(...data.map((d) => d.value), 0))
  const slot = plotW / data.length
  const barW = Math.min(slot * 0.6, 28)
  return (
    <Svg width={width} height={h}>
      <CartesianFrame width={width} height={h - (angled ? 24 : 0)} max={max} unit={unit} />
      {data.map((d, i) => {
        const x = M.left + slot * i + (slot - barW) / 2
        const barH = (d.value / max) * plotH
        return (
          <Rect
            key={`${d.label}-${i}`}
            x={x}
            y={M.top + plotH - barH}
            width={barW}
            height={Math.max(barH, d.value > 0 ? 2 : 0)}
            rx={2}
            fill={d.color ?? DEFAULT_COLOR}
          />
        )
      })}
      {data.map((d, i) => {
        const x = M.left + slot * i + slot / 2
        const y = h - 6
        const label = d.label.length > 9 ? d.label.slice(0, 8) + "…" : d.label
        const step = angled ? 1 : Math.max(1, Math.ceil(data.length / 8))
        if (i % step !== 0) return null
        return (
          <SvgText
            key={`l${i}`}
            x={x}
            y={y}
            textAnchor={angled ? "end" : "middle"}
            transform={angled ? `rotate(-35 ${x} ${y})` : undefined}
            fill={AXIS_COLOR}
            fontSize={AXIS_FONT_SIZE}
            fontFamily={fonts.sans}
          >
            {label}
          </SvgText>
        )
      })}
    </Svg>
  )
}

// --- Grouped vertical bar chart (2-3 series per category + legend) ---

export function GroupedVBarChart({
  data,
  series,
  width,
  height = 240,
}: {
  data: { label: string; values: number[] }[]
  series: { name: string; color: string }[]
  width: number
  height?: number
}) {
  if (data.length === 0) return <NoData />
  const plotW = width - M.left - M.right
  const plotH = height - M.top - M.bottom - 16
  const max = niceMax(Math.max(...data.flatMap((d) => d.values), 0))
  const slot = plotW / data.length
  const barW = Math.min((slot * 0.7) / series.length, 14)
  return (
    <View>
      <Svg width={width} height={height - 16}>
        <CartesianFrame width={width} height={height - 16} max={max} />
        {data.map((d, i) => {
          const groupX = M.left + slot * i + (slot - barW * series.length) / 2
          return d.values.map((v, s) => {
            const barH = (v / max) * plotH
            return (
              <Rect
                key={`${i}-${s}`}
                x={groupX + s * barW}
                y={M.top + plotH - barH}
                width={barW - 1}
                height={Math.max(barH, v > 0 ? 2 : 0)}
                rx={2}
                fill={series[s]?.color ?? DEFAULT_COLOR}
              />
            )
          })
        })}
        {data.map((d, i) => {
          const x = M.left + slot * i + slot / 2
          const y = height - 16 - 6
          const label = d.label.length > 8 ? d.label.slice(0, 7) + "…" : d.label
          return (
            <SvgText
              key={`l${i}`}
              x={x}
              y={y}
              textAnchor="end"
              transform={`rotate(-30 ${x} ${y})`}
              fill={AXIS_COLOR}
              fontSize={9}
              fontFamily={fonts.sans}
            >
              {label}
            </SvgText>
          )
        })}
      </Svg>
      <LegendRow items={series} />
    </View>
  )
}

// --- Line chart (single series) ---

export function LineChart({
  data,
  color = DEFAULT_COLOR,
  width,
  height = 200,
  unit = "",
}: {
  data: Datum[]
  color?: string
  width: number
  height?: number
  unit?: string
}) {
  if (data.length === 0) return <NoData />
  const plotW = width - M.left - M.right
  const plotH = height - M.top - M.bottom
  const max = niceMax(Math.max(...data.map((d) => d.value), 0))
  const points = data
    .map((d, i) => {
      const x = M.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW)
      const y = M.top + plotH - (d.value / max) * plotH
      return `${x},${y}`
    })
    .join(" ")
  return (
    <Svg width={width} height={height}>
      <CartesianFrame width={width} height={height} max={max} unit={unit} />
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <XLabels labels={data.map((d) => periodLabel(d.label))} width={width} height={height} />
    </Svg>
  )
}

// --- Dual line chart (the web's two-axis Overlay view) ---
// Each series is scaled to its own max, like recharts' left/right axes; the
// tick numerals carry the series colors so the two scales stay readable.

export function DualLineChart({
  data,
  seriesA,
  seriesB,
  width,
  height = 200,
}: {
  data: { label: string; a: number; b: number }[]
  seriesA: { name: string; color: string }
  seriesB: { name: string; color: string }
  width: number
  height?: number
}) {
  if (data.length === 0) return <NoData />
  const right = 36
  const plotW = width - M.left - right
  const plotH = height - M.top - M.bottom
  const maxA = niceMax(Math.max(...data.map((d) => d.a), 0))
  const maxB = niceMax(Math.max(...data.map((d) => d.b), 0))
  const line = (getter: (d: { a: number; b: number }) => number, max: number) =>
    data
      .map((d, i) => {
        const x = M.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW)
        const y = M.top + plotH - (getter(d) / max) * plotH
        return `${x},${y}`
      })
      .join(" ")
  return (
    <View>
      <Svg width={width} height={height}>
        {yTicks(maxA).map((t, i) => {
          const y = M.top + plotH - (t / maxA) * plotH
          return (
            <Line
              key={`g${i}`}
              x1={M.left}
              y1={y}
              x2={width - right}
              y2={y}
              stroke={GRID_COLOR}
              strokeDasharray="3 3"
            />
          )
        })}
        {yTicks(maxA).map((t, i) => {
          const y = M.top + plotH - (t / maxA) * plotH
          return (
            <SvgText
              key={`ta${i}`}
              x={M.left - 5}
              y={y + 3.5}
              textAnchor="end"
              fill={seriesA.color}
              fontSize={AXIS_FONT_SIZE}
              fontFamily={fonts.mono}
            >
              {tickLabel(t)}
            </SvgText>
          )
        })}
        {yTicks(maxB).map((t, i) => {
          const y = M.top + plotH - (t / maxB) * plotH
          return (
            <SvgText
              key={`tb${i}`}
              x={width - right + 5}
              y={y + 3.5}
              fill={seriesB.color}
              fontSize={AXIS_FONT_SIZE}
              fontFamily={fonts.mono}
            >
              {tickLabel(t)}
            </SvgText>
          )
        })}
        <Polyline points={line((d) => d.a, maxA)} fill="none" stroke={seriesA.color} strokeWidth={2} />
        <Polyline points={line((d) => d.b, maxB)} fill="none" stroke={seriesB.color} strokeWidth={2} />
        <XLabels labels={data.map((d) => periodLabel(d.label))} width={width} height={height} />
      </Svg>
      <LegendRow items={[seriesA, seriesB]} />
    </View>
  )
}

// --- Area chart (gradient fill like the web; cumulative option) ---

export function AreaChart({
  data,
  color = DEFAULT_COLOR,
  width,
  height = 200,
  cumulative,
  unit = "",
}: {
  data: Datum[]
  color?: string
  width: number
  height?: number
  cumulative?: boolean
  unit?: string
}) {
  if (data.length === 0) return <NoData />
  let running = 0
  const values = data.map((d) => (cumulative ? (running += d.value) : d.value))
  const plotW = width - M.left - M.right
  const plotH = height - M.top - M.bottom
  const max = niceMax(Math.max(...values, 0))
  const xy = values.map((v, i) => {
    const x = M.left + (values.length === 1 ? plotW / 2 : (i / (values.length - 1)) * plotW)
    const y = M.top + plotH - (v / max) * plotH
    return [x, y] as const
  })
  const line = xy.map(([x, y]) => `${x},${y}`).join(" ")
  const area = `${line} ${xy[xy.length - 1][0]},${M.top + plotH} ${xy[0][0]},${M.top + plotH}`
  const gradId = `area-${color.replace("#", "")}`
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.3} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <CartesianFrame width={width} height={height} max={max} unit={unit} />
      <Polygon points={area} fill={`url(#${gradId})`} />
      <Polyline points={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <XLabels labels={data.map((d) => periodLabel(d.label))} width={width} height={height} />
    </Svg>
  )
}

// --- Pie / donut chart with legend ---

function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const p = (r: number, a: number) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`
  const large = a1 - a0 > Math.PI ? 1 : 0
  if (r0 <= 0) {
    return `M ${p(r1, a0)} A ${r1} ${r1} 0 ${large} 1 ${p(r1, a1)} L ${cx} ${cy} Z`
  }
  return [
    `M ${p(r1, a0)}`,
    `A ${r1} ${r1} 0 ${large} 1 ${p(r1, a1)}`,
    `L ${p(r0, a1)}`,
    `A ${r0} ${r0} 0 ${large} 0 ${p(r0, a0)}`,
    "Z",
  ].join(" ")
}

export function PieChart({
  data,
  width,
  height = 200,
  innerRatio = 0,
}: {
  data: Datum[]
  width: number
  height?: number
  innerRatio?: number
}) {
  const slices = data.filter((d) => d.value > 0)
  const total = slices.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <NoData />
  const cx = width / 2
  const cy = height / 2
  const r1 = Math.min(width, height) / 2 - 8
  const r0 = r1 * innerRatio
  const pad = slices.length > 1 ? 0.025 : 0
  let angle = -Math.PI / 2
  return (
    <View>
      <Svg width={width} height={height}>
        {slices.map((d) => {
          const sweep = (d.value / total) * Math.PI * 2
          const a0 = angle + pad / 2
          const a1 = angle + sweep - pad / 2
          angle += sweep
          if (a1 <= a0) return null
          return <Path key={d.label} d={arcPath(cx, cy, r0, r1, a0, a1)} fill={d.color ?? DEFAULT_COLOR} />
        })}
      </Svg>
      <LegendRow items={slices.map((d) => ({ name: d.label, color: d.color ?? DEFAULT_COLOR }))} />
    </View>
  )
}

// --- Radar chart (1-2 series over shared axes + legend) ---

export function RadarChart({
  axes,
  series,
  width,
  height = 220,
}: {
  axes: string[]
  series: { name: string; color: string; values: number[]; fillOpacity?: number }[]
  width: number
  height?: number
}) {
  if (axes.length === 0 || series.length === 0) return <NoData />
  const cx = width / 2
  const cy = (height - 8) / 2 + 4
  const r = Math.min(width, height) / 2 - 28
  const max = niceMax(Math.max(...series.flatMap((s) => s.values), 0))
  const angleOf = (i: number) => -Math.PI / 2 + (i / axes.length) * Math.PI * 2
  const ringPoints = (scale: number) =>
    axes.map((_, i) => `${cx + r * scale * Math.cos(angleOf(i))},${cy + r * scale * Math.sin(angleOf(i))}`).join(" ")
  return (
    <View>
      <Svg width={width} height={height}>
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <Polygon key={scale} points={ringPoints(scale)} fill="none" stroke={GRID_COLOR} />
        ))}
        {axes.map((_, i) => (
          <Line
            key={`s${i}`}
            x1={cx}
            y1={cy}
            x2={cx + r * Math.cos(angleOf(i))}
            y2={cy + r * Math.sin(angleOf(i))}
            stroke={GRID_COLOR}
          />
        ))}
        {series.map((s) => (
          <Polygon
            key={s.name}
            points={s.values
              .map((v, i) => {
                const scale = (v / max) * r
                return `${cx + scale * Math.cos(angleOf(i))},${cy + scale * Math.sin(angleOf(i))}`
              })
              .join(" ")}
            fill={s.color}
            fillOpacity={s.fillOpacity ?? 0.3}
            stroke={s.color}
            strokeWidth={1.5}
          />
        ))}
        {axes.map((axis, i) => {
          const x = cx + (r + 13) * Math.cos(angleOf(i))
          const y = cy + (r + 13) * Math.sin(angleOf(i))
          return (
            <SvgText
              key={`a${i}`}
              x={x}
              y={y + 3.5}
              textAnchor="middle"
              fill={AXIS_COLOR}
              fontSize={AXIS_FONT_SIZE}
              fontFamily={fonts.sans}
            >
              {axis}
            </SvgText>
          )
        })}
      </Svg>
      {series.length > 1 && <LegendRow items={series} />}
    </View>
  )
}

// --- Scatter / dot plot (rank on x, value on y) ---

export function ScatterChart({
  data,
  width,
  height = 220,
  unit = "",
}: {
  data: { x: number; y: number; color?: string }[]
  width: number
  height?: number
  unit?: string
}) {
  if (data.length === 0) return <NoData />
  const plotW = width - M.left - M.right
  const plotH = height - M.top - M.bottom
  const maxX = Math.max(...data.map((d) => d.x), 1) + 1
  const maxY = niceMax(Math.max(...data.map((d) => d.y), 0))
  return (
    <Svg width={width} height={height}>
      <CartesianFrame width={width} height={height} max={maxY} unit={unit} />
      {data.map((d, i) => (
        <Circle
          key={i}
          cx={M.left + (d.x / maxX) * plotW}
          cy={M.top + plotH - (d.y / maxY) * plotH}
          r={5}
          fill={d.color ?? DEFAULT_COLOR}
        />
      ))}
      {Array.from({ length: Math.min(maxX, 6) }, (_, i) => {
        const v = Math.round(((i + 1) / Math.min(maxX, 6)) * (maxX - 1))
        if (v <= 0) return null
        return (
          <SvgText
            key={`x${i}`}
            x={M.left + (v / maxX) * plotW}
            y={height - 6}
            textAnchor="middle"
            fill={AXIS_COLOR}
            fontSize={AXIS_FONT_SIZE}
            fontFamily={fonts.mono}
          >
            {String(v)}
          </SvgText>
        )
      })}
    </Svg>
  )
}

// --- Treemap (squarified) ---

interface TreeRect {
  label: string
  value: number
  color: string
  x: number
  y: number
  w: number
  h: number
}

// Standard squarified treemap: pack a sorted row along the shorter side
// while the worst aspect ratio keeps improving, then recurse on the rest.
function squarify(items: { label: string; value: number; color: string }[], x: number, y: number, w: number, h: number): TreeRect[] {
  const sorted = items.filter((d) => d.value > 0).sort((a, b) => b.value - a.value)
  if (sorted.length === 0) return []
  const total = sorted.reduce((s, d) => s + d.value, 0)
  const scale = (w * h) / total
  const areas = sorted.map((d) => ({ ...d, area: d.value * scale }))

  const rects: TreeRect[] = []
  let rx = x
  let ry = y
  let rw = w
  let rh = h
  let row: typeof areas = []
  let rest = areas

  const worst = (r: typeof areas, side: number) => {
    const sum = r.reduce((s, d) => s + d.area, 0)
    const sw = sum / side
    return Math.max(...r.map((d) => Math.max(sw / (d.area / sw), (d.area / sw) / sw)))
  }

  const layoutRow = (r: typeof areas) => {
    const sum = r.reduce((s, d) => s + d.area, 0)
    if (rw >= rh) {
      const colW = sum / rh
      let cy = ry
      for (const d of r) {
        const cellH = d.area / colW
        rects.push({ label: d.label, value: d.value, color: d.color, x: rx, y: cy, w: colW, h: cellH })
        cy += cellH
      }
      rx += colW
      rw -= colW
    } else {
      const rowH = sum / rw
      let cx = rx
      for (const d of r) {
        const cellW = d.area / rowH
        rects.push({ label: d.label, value: d.value, color: d.color, x: cx, y: ry, w: cellW, h: rowH })
        cx += cellW
      }
      ry += rowH
      rh -= rowH
    }
  }

  while (rest.length > 0) {
    const side = Math.min(rw, rh)
    const next = [...row, rest[0]]
    if (row.length === 0 || worst(next, side) <= worst(row, side)) {
      row = next
      rest = rest.slice(1)
    } else {
      layoutRow(row)
      row = []
    }
  }
  if (row.length > 0) layoutRow(row)
  return rects
}

export function TreemapChart({
  data,
  width,
  height = 220,
}: {
  data: { label: string; value: number; color: string }[]
  width: number
  height?: number
}) {
  const rects = squarify(data, 0, 0, width, height)
  if (rects.length === 0) return <NoData />
  return (
    <Svg width={width} height={height}>
      {rects.map((r, i) => (
        <Rect
          key={`${r.label}-${i}`}
          x={r.x + 1}
          y={r.y + 1}
          width={Math.max(r.w - 2, 0)}
          height={Math.max(r.h - 2, 0)}
          rx={2}
          fill={r.color}
        />
      ))}
      {rects.map((r, i) =>
        r.w > 40 && r.h > 18 ? (
          <SvgText
            key={`t${i}`}
            x={r.x + r.w / 2}
            y={r.y + r.h / 2 + 3.5}
            textAnchor="middle"
            fill={INK}
            fontSize={11}
            fontFamily={fonts.sans}
          >
            {r.label}
          </SvgText>
        ) : null
      )}
    </Svg>
  )
}
