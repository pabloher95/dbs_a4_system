"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { createClient } from "../lib/supabase-browser";
import type { WeatherHistoryPoint } from "../lib/types";
import { buildTemperatureSeries } from "../lib/weather";

type Props = {
  initialHistory: WeatherHistoryPoint[];
};

const CITY_COLORS = ["#22d3ee", "#fbbf24", "#a78bfa", "#34d399", "#f97316"];
const CITY_TIMEZONES: Record<string, string> = {
  "new-york-city": "America/New_York",
  tokyo: "Asia/Tokyo",
  "buenos-aires": "America/Argentina/Buenos_Aires",
  "mexico-city": "America/Mexico_City",
  berlin: "Europe/Berlin"
};

export function WeatherChart({ initialHistory }: Props) {
  const [history, setHistory] = useState(initialHistory);
  const cityNameToSlug = new Map(history.map((point) => [point.city_name, point.city_slug]));

  useEffect(() => {
    setHistory(initialHistory);
  }, [initialHistory]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("weather-dashboard")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "weather_snapshots" },
        async () => {
          const { data, error } = await supabase.rpc("get_recent_weather_history_for_user", {
            limit_per_city: 8
          });
          if (!error && data) {
            setHistory(data as WeatherHistoryPoint[]);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const { chartData, cityNames } = buildTemperatureSeries(history);

  return (
    <div className="glass-panel terminal-panel px-6 py-6 md:px-7">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-ink/45">History</div>
          <h2 className="mt-2 font-display text-4xl leading-none text-ink">Temperature rhythm</h2>
        </div>
        <div className="text-sm text-ink/55">Temperature over the last several readings per city</div>
      </div>
      <div className="mt-6 h-64 md:h-72">
        {cityNames.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-storm/20 bg-panel/40 px-6 text-center text-sm leading-7 text-ink/55">
            No history yet. Once the worker writes multiple snapshots for a subscribed city, this chart will show the temperature shape over time.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.10)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="rgba(220, 232, 244, 0.40)" tick={{ fill: "rgba(220,232,244,0.60)" }} />
              <YAxis tickLine={false} axisLine={false} stroke="rgba(220, 232, 244, 0.40)" tick={{ fill: "rgba(220,232,244,0.60)" }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const observedAt = String((payload[0].payload as { observedAt?: string }).observedAt ?? "");
                  const observedAtDate = observedAt ? new Date(observedAt) : null;

                  return (
                    <div className="rounded-xl border border-storm/25 bg-[#0b1f3f]/95 px-3 py-2 text-xs text-ink shadow-xl">
                      <div className="mb-2 uppercase tracking-[0.16em] text-ink/60">{label}</div>
                      <div className="grid gap-1.5">
                        {payload.map((entry) => {
                          const cityName = String(entry.name ?? "");
                          const citySlug = cityNameToSlug.get(cityName) ?? "";
                          const timezone = CITY_TIMEZONES[citySlug];
                          const localTime =
                            observedAtDate && timezone
                              ? new Intl.DateTimeFormat("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                  timeZone: timezone
                                }).format(observedAtDate)
                              : "--:--";

                          return (
                            <div key={cityName} className="flex items-center justify-between gap-3">
                              <span className="font-semibold" style={{ color: String(entry.color ?? "#dbeafe") }}>
                                {cityName}
                              </span>
                              <span className="text-ink/85">
                                {Number(entry.value).toFixed(1)}°C at {localTime}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              {cityNames.map((cityName, index) => (
                <Line
                  key={cityName}
                  type="monotone"
                  dataKey={cityName}
                  stroke={CITY_COLORS[index % CITY_COLORS.length]}
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
