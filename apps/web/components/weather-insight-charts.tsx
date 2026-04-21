"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { WeatherHistoryPoint, WeatherSnapshot } from "../lib/types";
import { buildInsightRows, getWeatherCodeLabel } from "../lib/weather";
import { GoldenHourPanel } from "./golden-hour-panel";

type Props = {
  latestSnapshots: WeatherSnapshot[];
  history: WeatherHistoryPoint[];
};

const TEMPERATURE_COLORS = ["#22d3ee", "#0891b2", "#7dd3fc", "#fbbf24", "#f97316"];
const CONDITION_COLORS = ["#22d3ee", "#a78bfa", "#34d399", "#fbbf24", "#f97316"];

const tooltipStyle = {
  backgroundColor: "rgba(9, 30, 58, 0.92)",
  border: "1px solid rgba(34, 211, 238, 0.25)",
  borderRadius: "14px",
  color: "rgba(226, 239, 250, 0.96)",
  boxShadow: "0 10px 24px rgba(2, 12, 27, 0.35)"
};

const tooltipLabelStyle = {
  color: "rgba(226, 239, 250, 0.72)",
  fontSize: "12px",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const
};

const tooltipItemStyle = {
  color: "rgba(226, 239, 250, 0.96)",
  fontWeight: 600
};

export function WeatherInsightCharts({ latestSnapshots, history }: Props) {
  const insightRows = buildInsightRows(latestSnapshots, history);

  const temperatureRanking = [...insightRows]
    .sort((left, right) => right.temperature_c - left.temperature_c)
    .map((row) => ({
      city: row.city_name,
      temperature: row.temperature_c,
      comfort: row.comfortScore
    }));

  const conditionMix = Array.from(
    insightRows.reduce((acc, row) => {
      const label = getWeatherCodeLabel(row.weather_code);
      acc.set(label, (acc.get(label) ?? 0) + 1);
      return acc;
    }, new Map<string, number>())
  ).map(([name, count]) => ({ name, count }));

  return (
    <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="glass-panel terminal-panel motion-card px-6 py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-ink/45">Ranked now</div>
            <h2 className="mt-2 font-display text-4xl leading-none text-ink">Thermal order</h2>
          </div>
          <div className="text-sm text-ink/55">Current temperatures sorted from hottest to coolest</div>
        </div>
        <div className="mt-6 h-80">
          {temperatureRanking.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-storm/20 bg-panel/40 px-6 text-center text-sm leading-7 text-ink/55">
              No ranking yet. Subscribe to cities and let the worker write fresh data.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={temperatureRanking} layout="vertical" margin={{ left: 8, right: 8 }}>
                <XAxis type="number" tickLine={false} axisLine={false} stroke="rgba(220,232,244,0.40)" tick={{ fill: "rgba(220,232,244,0.60)" }} />
                <YAxis
                  type="category"
                  dataKey="city"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  stroke="rgba(220,232,244,0.40)"
                  tick={{ fill: "rgba(220,232,244,0.60)" }}
                />
                <Tooltip
                  isAnimationActive={false}
                  cursor={false}
                  wrapperStyle={{ outline: "none", pointerEvents: "none" }}
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: number) => [`${value.toFixed(1)}°C`, "Temperature"]}
                />
                <Bar dataKey="temperature" radius={[0, 14, 14, 0]}>
                  {temperatureRanking.map((entry, index) => (
                    <Cell key={`${entry.city}-${entry.temperature}`} fill={TEMPERATURE_COLORS[index % TEMPERATURE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="glass-panel terminal-panel motion-card px-6 py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-ink/45">Condition mix</div>
            <h2 className="mt-2 font-display text-4xl leading-none text-ink">Current regimes</h2>
          </div>
          <div className="text-sm text-ink/55">Weather conditions across your cities right now</div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="h-64">
            {conditionMix.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-storm/20 bg-panel/40 px-6 text-center text-sm leading-7 text-ink/55">
                Condition breakdown appears once snapshots exist.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={conditionMix} dataKey="count" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={4}>
                    {conditionMix.map((entry, index) => (
                      <Cell key={entry.name} fill={CONDITION_COLORS[index % CONDITION_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    isAnimationActive={false}
                    wrapperStyle={{ outline: "none", pointerEvents: "none" }}
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                    formatter={(value: number) => [`${value} cities`, "Count"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid gap-3">
            {conditionMix.map((entry, index) => (
              <div key={entry.name} className="motion-tile flex items-center justify-between rounded-[22px] border border-storm/15 bg-panel px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: CONDITION_COLORS[index % CONDITION_COLORS.length] }}
                  />
                  <span className="text-sm font-semibold text-ink">{entry.name}</span>
                </div>
                <span className="text-sm text-ink/60">{entry.count} {entry.count === 1 ? "city" : "cities"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <GoldenHourPanel latestSnapshots={latestSnapshots} />
    </section>
  );
}
