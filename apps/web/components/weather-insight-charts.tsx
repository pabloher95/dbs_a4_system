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

type Props = {
  latestSnapshots: WeatherSnapshot[];
  history: WeatherHistoryPoint[];
};

const TEMPERATURE_COLORS = ["#214a68", "#3c6686", "#5b7c96", "#8fc4db", "#ffb35c"];
const CONDITION_COLORS = ["#214a68", "#5b7c96", "#8fc4db", "#ffb35c", "#ff8a5b"];
const PRECIP_COLORS = ["#214a68", "#5b7c96", "#8fc4db", "#ffb35c", "#ff8a5b"];

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

  const precipitationRanking = [...insightRows]
    .filter((row) => row.precipitation_mm !== null && row.precipitation_mm > 0)
    .sort((left, right) => (right.precipitation_mm ?? 0) - (left.precipitation_mm ?? 0))
    .map((row) => ({
      city: row.city_name,
      precipitation: row.precipitation_mm ?? 0
    }));

  return (
    <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="glass-panel terminal-panel px-6 py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-ink/45">Ranked now</div>
            <h2 className="mt-2 font-display text-4xl leading-none text-ink">Thermal order</h2>
          </div>
          <div className="text-sm text-ink/55">Current temperatures sorted from hottest to coolest</div>
        </div>
        <div className="mt-6 h-80">
          {temperatureRanking.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-storm/10 bg-white/35 px-6 text-center text-sm leading-7 text-ink/55">
              No ranking yet. Subscribe to cities and let the worker write fresh data.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={temperatureRanking} layout="vertical" margin={{ left: 8, right: 8 }}>
                <XAxis type="number" tickLine={false} axisLine={false} stroke="rgba(22, 33, 43, 0.45)" />
                <YAxis
                  type="category"
                  dataKey="city"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  stroke="rgba(22, 33, 43, 0.45)"
                />
                <Tooltip />
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
      <div className="glass-panel terminal-panel px-6 py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-ink/45">Condition mix</div>
            <h2 className="mt-2 font-display text-4xl leading-none text-ink">Current regimes</h2>
          </div>
          <div className="text-sm text-ink/55">How the selected feed is split across conditions right now</div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="h-64">
            {conditionMix.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-storm/10 bg-white/35 px-6 text-center text-sm leading-7 text-ink/55">
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid gap-3">
            {conditionMix.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between rounded-[22px] border border-storm/10 bg-white/60 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: CONDITION_COLORS[index % CONDITION_COLORS.length] }}
                  />
                  <span className="text-sm font-semibold text-ink">{entry.name}</span>
                </div>
                <span className="text-sm text-ink/60">{entry.count} city{entry.count === 1 ? "" : "ies"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="glass-panel terminal-panel px-6 py-6 xl:col-span-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-ink/45">Precipitation board</div>
            <h2 className="mt-2 font-display text-4xl leading-none text-ink">Wet signal</h2>
          </div>
          <div className="text-sm text-ink/55">Current precipitation from the latest worker write, ranked by mm</div>
        </div>
        <div className="mt-6 h-72">
          {precipitationRanking.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-storm/10 bg-white/35 px-6 text-center text-sm leading-7 text-ink/55">
              No current precipitation across the selected cities. This panel will light up when any city turns wet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={precipitationRanking} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(33, 74, 104, 0.10)" />
                <XAxis dataKey="city" tickLine={false} axisLine={false} stroke="rgba(22, 33, 43, 0.45)" />
                <YAxis tickLine={false} axisLine={false} stroke="rgba(22, 33, 43, 0.45)" />
                <Tooltip />
                <Bar dataKey="precipitation" radius={[14, 14, 0, 0]}>
                  {precipitationRanking.map((entry, index) => (
                    <Cell key={`${entry.city}-${entry.precipitation}`} fill={PRECIP_COLORS[index % PRECIP_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}
