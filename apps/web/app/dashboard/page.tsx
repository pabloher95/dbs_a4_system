import { redirect } from "next/navigation";
import { DashboardLive } from "../../components/dashboard-live";
import { SignOutButton } from "../../components/sign-out-button";
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

  const { data: cities } = await supabase
    .from("cities")
    .select("id, slug, name, country_code, timezone")
    .order("name");

  const cityRows = (cities ?? []) as City[];

  if (cityRows.length > 0) {
    await supabase.from("user_city_subscriptions").upsert(
      cityRows.map((city) => ({
        user_id: user.id,
        city_id: city.id
      })),
      { onConflict: "user_id,city_id" }
    );
  }

  const [{ data: snapshots }, { data: history }] = await Promise.all([
    supabase.rpc("get_latest_weather_for_user"),
    supabase.rpc("get_recent_weather_history_for_user", { limit_per_city: 8 })
  ]);

  return (
    <main className="app-shell py-6 md:py-10">
      <section className="glass-panel terminal-panel radar-sweep overflow-hidden px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="section-kicker">A Tale of Five Cities</div>
            <h1 className="mt-3 max-w-[9ch] font-display text-5xl leading-[0.92] md:text-7xl">A Tale of Five Cities</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/70 md:text-lg">
              Berlin, Buenos Aires, Mexico City, New York, and Tokyo each tell a different weather story as the day unfolds.
            </p>
          </div>
          <SignOutButton />
        </div>
      </section>
      <DashboardLive
        initialSnapshots={(snapshots ?? []) as WeatherSnapshot[]}
        initialHistory={(history ?? []) as WeatherHistoryPoint[]}
      />
    </main>
  );
}
