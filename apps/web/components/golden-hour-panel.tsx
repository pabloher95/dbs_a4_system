 "use client";

import { useEffect, useState } from "react";
import type { WeatherSnapshot } from "../lib/types";

type Props = {
  latestSnapshots: WeatherSnapshot[];
};

function parseHours(timeStr: string | null): number | null {
  if (!timeStr) return null;
  const [hh, mm] = timeStr.split(":").map(Number);
  if (isNaN(hh) || isNaN(mm)) return null;
  return hh + mm / 60;
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return "--:--";
  const [hh, mm] = timeStr.split(":");
  if (!hh || !mm) return "--:--";
  const h = parseInt(hh, 10);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return `${h12}:${mm}${suffix}`;
}

function DaylightArc({
  sunriseHours,
  sunsetHours,
  isDay,
  currentHours
}: {
  sunriseHours: number | null;
  sunsetHours: number | null;
  isDay: boolean;
  currentHours: number | null;
}) {
  if (sunriseHours === null || sunsetHours === null) {
    return (
      <div className="h-1 w-full rounded-full bg-panel">
        <div className="h-full w-0 rounded-full bg-storm/30" />
      </div>
    );
  }

  const daylightSpan = Math.max(sunsetHours - sunriseHours, 0.5);
  const progress = currentHours === null ? 0 : Math.min(Math.max((currentHours - sunriseHours) / daylightSpan, 0), 1);
  const progressPct = `${(progress * 100).toFixed(1)}%`;

  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-panel">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: progressPct,
          background: isDay
            ? "linear-gradient(to right, #fbbf24, #22d3ee)"
            : "linear-gradient(to right, #1e3456, #0891b2)"
        }}
      />
    </div>
  );
}

export function GoldenHourPanel({ latestSnapshots }: Props) {
  const [currentHours, setCurrentHours] = useState<number | null>(null);
  const cities = latestSnapshots.filter((s) => s.sunrise_local || s.sunset_local || s.is_day !== undefined);

  useEffect(() => {
    const updateCurrentHours = () => {
      const now = new Date();
      setCurrentHours(now.getHours() + now.getMinutes() / 60);
    };

    updateCurrentHours();
    const interval = setInterval(updateCurrentHours, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel terminal-panel motion-card px-6 py-6 xl:col-span-2">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-storm/70">Golden hour</div>
          <h2 className="mt-2 font-display text-4xl leading-none text-ink">Daylight windows</h2>
        </div>
        <div className="text-sm text-ink/55">When the sun rises and sets in each of your cities today</div>
      </div>

      {cities.length === 0 ? (
        <div className="mt-6 flex h-48 items-center justify-center rounded-[24px] border border-dashed border-storm/20 bg-panel/40 px-6 text-center text-sm leading-7 text-ink/55">
          Subscribe to cities to see their daylight windows.
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cities.map((city) => {
            const sunriseHours = parseHours(city.sunrise_local);
            const sunsetHours = parseHours(city.sunset_local);
            const daylightHours = sunriseHours !== null && sunsetHours !== null
              ? (sunsetHours - sunriseHours).toFixed(1)
              : null;

            return (
              <div
                key={city.city_id}
                className={`motion-tile relative overflow-hidden rounded-[24px] border px-5 py-5 transition ${
                  city.is_day
                    ? "border-storm/25 bg-[#091e3a]"
                    : "border-mist/20 bg-cloud/80"
                }`}
              >
                {city.is_day && (
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-signal/10 blur-2xl" />
                )}

                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-[0.22em] text-storm/70">
                      {city.city_slug.replace(/-/g, " ")}
                    </div>
                    <div className="mt-1 font-display text-2xl leading-tight text-ink">
                      {city.city_name}
                    </div>
                  </div>
                  <div className={`flex-shrink-0 rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] ${
                    city.is_day
                      ? "bg-signal/20 text-signal"
                      : "bg-mist/10 text-ink/50"
                  }`}>
                    {city.is_day ? "Day" : "Night"}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[0.65rem] uppercase tracking-[0.2em] text-ink/40">Sunrise</div>
                    <div className="mt-1 font-display text-xl text-storm">
                      {formatTime(city.sunrise_local)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[0.65rem] uppercase tracking-[0.2em] text-ink/40">Sunset</div>
                    <div className="mt-1 font-display text-xl text-signal">
                      {formatTime(city.sunset_local)}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <DaylightArc
                    sunriseHours={sunriseHours}
                    sunsetHours={sunsetHours}
                    isDay={city.is_day}
                    currentHours={currentHours}
                  />
                  {daylightHours && (
                    <div className="mt-2 text-xs text-ink/40">
                      {daylightHours}h of daylight
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
