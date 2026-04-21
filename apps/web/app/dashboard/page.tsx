import { redirect } from "next/navigation";
import { CitySelector } from "../../components/city-selector";
import { DashboardCurrentReads, DashboardTopline } from "../../components/dashboard-metrics";
import { SignOutButton } from "../../components/sign-out-button";
import { WeatherInsightCharts } from "../../components/weather-insight-charts";
import { WeatherChart } from "../../components/weather-chart";
import { createClient } from "../../lib/supabase-server";
import type { City, WeatherHistoryPoint, WeatherSnapshot } from "../../lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: cities }, { data: subscriptions }, { data: snapshots }, { data: history }] = await Promise.all([
    supabase.from("cities").select("id, slug, name, country_code, timezone").order("name"),
    supabase.from("user_city_subscriptions").select("city_id").eq("user_id", user.id),
    supabase.rpc("get_latest_weather_for_user"),
    supabase.rpc("get_recent_weather_history_for_user", { limit_per_city: 8 })
  ]);

  const selectedCityIds = (subscriptions ?? []).map((row) => row.city_id as string);

  return (
    <main className="app-shell py-6 md:py-10">
      <section className="glass-panel terminal-panel radar-sweep overflow-hidden px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="section-kicker">Forecast Bureau</div>
            <h1 className="mt-3 max-w-[9ch] font-display text-5xl leading-[0.92] md:text-7xl">Weather feed</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/70 md:text-lg">
              Select the cities you want. Fresh worker inserts are translated into rankings, regime splits, and trend shifts through Supabase Realtime.
            </p>
          </div>
          <SignOutButton />
        </div>
      </section>
      <div className="mt-6">
        <CitySelector
          cities={(cities ?? []) as City[]}
          selectedCityIds={selectedCityIds}
          userId={user.id}
        />
      </div>
      <section className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardTopline
          latestSnapshots={(snapshots ?? []) as WeatherSnapshot[]}
          history={(history ?? []) as WeatherHistoryPoint[]}
        />
        <WeatherChart initialHistory={(history ?? []) as WeatherHistoryPoint[]} />
      </section>
      <section className="mt-6">
        <DashboardCurrentReads
          latestSnapshots={(snapshots ?? []) as WeatherSnapshot[]}
          history={(history ?? []) as WeatherHistoryPoint[]}
        />
      </section>
      <div className="mt-6">
        <WeatherInsightCharts
          latestSnapshots={(snapshots ?? []) as WeatherSnapshot[]}
          history={(history ?? []) as WeatherHistoryPoint[]}
        />
      </div>
    </main>
  );
}
