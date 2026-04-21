"use client";

import { useEffect, useState } from "react";
import type { WeatherHistoryPoint, WeatherSnapshot } from "../lib/types";
import { createClient } from "../lib/supabase-browser";
import { DashboardCurrentReads, DashboardTopline } from "./dashboard-metrics";
import { WeatherInsightCharts } from "./weather-insight-charts";
import { WeatherChart } from "./weather-chart";

type Props = {
  initialSnapshots: WeatherSnapshot[];
  initialHistory: WeatherHistoryPoint[];
};

export function DashboardLive({ initialSnapshots, initialHistory }: Props) {
  const [snapshots, setSnapshots] = useState(initialSnapshots);
  const [history, setHistory] = useState(initialHistory);

  useEffect(() => {
    setSnapshots(initialSnapshots);
    setHistory(initialHistory);
  }, [initialSnapshots, initialHistory]);

  useEffect(() => {
    const supabase = createClient();

    async function reloadAll() {
      const [{ data: latestData }, { data: historyData }] = await Promise.all([
        supabase.rpc("get_latest_weather_for_user"),
        supabase.rpc("get_recent_weather_history_for_user", { limit_per_city: 8 })
      ]);

      if (latestData) setSnapshots(latestData as WeatherSnapshot[]);
      if (historyData) setHistory(historyData as WeatherHistoryPoint[]);
    }

    const channel = supabase
      .channel("dashboard-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "weather_snapshots" }, () => {
        void reloadAll();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      <section className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardTopline latestSnapshots={snapshots} history={history} />
        <WeatherChart initialHistory={history} />
      </section>
      <section className="mt-6">
        <DashboardCurrentReads latestSnapshots={snapshots} history={history} />
      </section>
      <div className="mt-6">
        <WeatherInsightCharts latestSnapshots={snapshots} history={history} />
      </div>
    </>
  );
}
