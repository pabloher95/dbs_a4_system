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

export function WeatherChart({ initialHistory }: Props) {
  const [history, setHistory] = useState(initialHistory);

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
              <Tooltip />
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
