import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase-server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="app-shell py-6 md:py-10">
      <section className="glass-panel relative overflow-hidden px-6 py-8 md:px-10 md:py-12">
        <div className="absolute inset-y-0 left-[58%] hidden w-px bg-storm/15 lg:block" />
        <div className="absolute -right-10 top-8 h-48 w-48 rounded-full bg-storm/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-signal/15 blur-3xl" />
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="relative space-y-6">
            <div className="section-kicker">A Tale of Five Cities</div>
            <div className="space-y-5">
              <h1 className="max-w-[10ch] font-display text-5xl leading-[0.9] md:text-7xl">A Tale of Five Cities</h1>
              <p className="max-w-2xl text-base leading-7 text-ink/70 md:text-lg">
                From Tokyo mornings to New York afternoons, this is a live portrait of five cities moving through the same day in different ways.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="action-primary" href="/login">
                Enter dashboard
              </Link>
              <Link className="action-secondary" href="/dashboard">
                Preview live view
              </Link>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-storm/30 bg-storm/20 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-storm/80">City pulse</div>
              <div className="mt-3 font-display text-4xl text-storm">5m</div>
              <p className="mt-2 text-sm leading-6 text-ink/70">A new reading every five minutes keeps each city's mood current.</p>
            </div>
            <div className="metric-tile">
              <div className="text-xs uppercase tracking-[0.24em] text-ink/45">Tracked cities</div>
              <div className="mt-3 font-display text-4xl">5</div>
              <p className="mt-2 text-sm leading-6 text-ink/65">New York City, Tokyo, Buenos Aires, Mexico City, and Berlin.</p>
            </div>
            <div className="rounded-[24px] border border-signal/20 bg-signal/10 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-signal/80">Shared moment</div>
              <p className="mt-3 text-sm leading-7 text-ink/75">One timeline, five climates: clear skies, humidity, wind, and daylight all side by side.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
