import type { WeatherHistoryPoint, WeatherSnapshot } from "../lib/types";
import { summarizeWeather } from "../lib/weather";

type Props = {
  latestSnapshots: WeatherSnapshot[];
  history: WeatherHistoryPoint[];
};

function formatDelta(value: number | null) {
  if (value === null) {
    return "Need more history";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}°C since last reading`;
}

function formatFeelsLikeGap(value: number | null) {
  if (value === null) {
    return "Feels-like unavailable";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}°C feels-like gap`;
}

function EmptyInsightsState() {
  return (
    <div className="glass-panel terminal-panel flex min-h-[420px] flex-col justify-between bg-[#091e3a] px-6 py-6 text-ink">
      <div>
        <div className="text-xs uppercase tracking-[0.24em] text-storm/70">Insights</div>
        <h2 className="mt-3 font-display text-4xl">No weather insights yet.</h2>
        <p className="mt-4 max-w-lg text-sm leading-7 text-ink/70">
          Add one or more cities below. Once readings come in, this panel will show temperature trends, volatility, comfort scores, and how far apart your cities are.
        </p>
      </div>
    </div>
  );
}

export function DashboardTopline({ latestSnapshots, history }: Props) {
  const summary = summarizeWeather(latestSnapshots, history);

  if (summary.rows.length === 0) {
    return <EmptyInsightsState />;
  }

  return (
    <div className="glass-panel terminal-panel overflow-hidden bg-[#091e3a] px-6 py-6 text-ink">
      <div className="grid gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <div className="text-xs uppercase tracking-[0.24em] text-storm/70">Topline</div>
            <h2 className="mt-3 max-w-[14ch] font-display text-4xl leading-[0.95] md:text-5xl">
              {summary.hottest?.city_name} is the warmest right now.
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink/70 md:text-base">
              It is currently the warmest city at {summary.hottest?.temperature_c.toFixed(1)}°C, while the full
              feed spans {summary.spread?.toFixed(1)}°C from coolest to hottest.
            </p>
          </div>
          <div className="terminal-pulse rounded-[28px] border border-storm/20 bg-storm/10 px-5 py-4 lg:min-w-[220px]">
            <div className="text-[0.7rem] uppercase tracking-[0.24em] text-storm/70">Comfort pick</div>
            <div className="mt-2 break-words font-display text-3xl leading-tight">
              {summary.bestOutdoors?.city_name}
            </div>
            <div className="mt-2 text-sm text-ink/70">Score {summary.bestOutdoors?.comfortScore}</div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[24px] border border-storm/20 bg-panel/60 p-4">
            <div className="text-[0.7rem] uppercase tracking-[0.24em] text-storm/70">Wind leader</div>
            <div className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-ink/60">
              {summary.breeziest?.city_name}
            </div>
            <div className="mt-1 font-display text-3xl">{summary.breeziest?.wind_speed_kph.toFixed(1)} kph</div>
          </div>
          <div className="rounded-[24px] border border-storm/20 bg-panel/60 p-4">
            <div className="text-[0.7rem] uppercase tracking-[0.24em] text-storm/70">Most volatile</div>
            <div className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-ink/60">
              {summary.mostVolatile?.city_name ?? "Not enough data"}
            </div>
            <div className="mt-1 text-sm text-ink/70">
              {summary.mostVolatile?.volatility !== null && summary.mostVolatile?.volatility !== undefined
                ? `${summary.mostVolatile.volatility.toFixed(1)}°C swing`
                : "Need more history"}
            </div>
          </div>
          <div className="rounded-[24px] border border-storm/20 bg-panel/60 p-4">
            <div className="text-[0.7rem] uppercase tracking-[0.24em] text-storm/70">Daylight mix</div>
            <div className="mt-3 font-display text-3xl">
              {summary.daylightCount}/{summary.rows.length}
            </div>
            <div className="mt-2 text-sm text-ink/70">Cities currently in daytime</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardCurrentReads({ latestSnapshots, history }: Props) {
  const summary = summarizeWeather(latestSnapshots, history);

  if (summary.rows.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel terminal-panel px-6 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-ink/45">What stands out</div>
          <h2 className="mt-2 font-display text-4xl leading-none text-ink">Current city reads</h2>
        </div>
        <div className="text-sm text-ink/55">
          {summary.sharpestShift
            ? `${summary.sharpestShift.city_name} has moved the most recently`
            : "More readings will reveal which city is shifting fastest"}
        </div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <div className="rounded-[24px] border border-storm/15 bg-panel p-4">
          <div className="text-[0.7rem] uppercase tracking-[0.24em] text-storm/70">Muggiest city</div>
          <div className="mt-2 font-display text-3xl text-ink">{summary.muggiest?.city_name ?? "--"}</div>
          <div className="mt-2 text-sm text-ink/60">
            {summary.muggiest?.relative_humidity !== null && summary.muggiest?.relative_humidity !== undefined
              ? `${summary.muggiest.relative_humidity}% humidity`
              : "Humidity data pending"}
          </div>
        </div>
        <div className="rounded-[24px] border border-storm/15 bg-panel p-4">
          <div className="text-[0.7rem] uppercase tracking-[0.24em] text-storm/70">Feels-like gap</div>
          <div className="mt-2 font-display text-3xl text-ink">{summary.hottest?.city_name ?? "--"}</div>
          <div className="mt-2 text-sm text-ink/60">{formatFeelsLikeGap(summary.hottest?.feelsLikeGap ?? null)}</div>
        </div>
        <div className="rounded-[24px] border border-storm/15 bg-panel p-4">
          <div className="text-[0.7rem] uppercase tracking-[0.24em] text-storm/70">Coolest city</div>
          <div className="mt-2 font-display text-3xl text-ink">{summary.coolest?.city_name ?? "--"}</div>
          <div className="mt-2 text-sm text-ink/60">
            {summary.coolest ? `${summary.coolest.temperature_c.toFixed(1)}°C right now` : "Waiting for snapshots"}
          </div>
        </div>
        <div className="rounded-[24px] border border-storm/15 bg-panel p-4">
          <div className="text-[0.7rem] uppercase tracking-[0.24em] text-storm/70">Wettest city</div>
          <div className="mt-2 font-display text-3xl text-ink">{summary.wettest?.city_name ?? "--"}</div>
          <div className="mt-2 text-sm text-ink/60">
            {summary.wettest?.precipitation_mm !== null && summary.wettest?.precipitation_mm !== undefined
              ? `${summary.wettest.precipitation_mm.toFixed(1)} mm current precipitation`
              : "Precipitation data pending"}
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-3">
        {summary.rows.map((row) => (
          <div key={row.city_id} className="rounded-[24px] border border-storm/15 bg-panel px-4 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 xl:w-[24%]">
                <div className="font-semibold text-ink">{row.city_name}</div>
                <div className="mt-1 text-sm text-ink/55">{row.condition}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-storm">{row.trend}</div>
              </div>
              <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-[18px] border border-storm/15 bg-cloud/80 px-3 py-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-ink/40">Temperature</div>
                  <div className="mt-1 text-lg font-semibold text-ink">{row.temperature_c.toFixed(1)}°C</div>
                  <div className="mt-1 text-xs text-ink/55">
                    {row.apparent_temperature_c === null ? "Feels-like pending" : `Feels like ${row.apparent_temperature_c.toFixed(1)}°C`}
                  </div>
                </div>
                <div className="rounded-[18px] border border-storm/15 bg-cloud/80 px-3 py-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-ink/40">Wind</div>
                  <div className="mt-1 text-lg font-semibold text-ink">{row.wind_speed_kph.toFixed(1)} kph</div>
                </div>
                <div className="rounded-[18px] border border-storm/15 bg-cloud/80 px-3 py-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-ink/40">Humidity</div>
                  <div className="mt-1 text-lg font-semibold text-ink">
                    {row.relative_humidity === null ? "--" : `${row.relative_humidity}%`}
                  </div>
                  <div className="mt-1 text-xs text-ink/55">
                    {row.volatility === null ? "Need more history" : `${row.volatility.toFixed(1)}°C recent swing`}
                  </div>
                </div>
                <div className="rounded-[18px] border border-storm/15 bg-cloud/80 px-3 py-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-ink/40">Precip</div>
                  <div className="mt-1 text-lg font-semibold text-ink">
                    {row.precipitation_mm === null ? "--" : `${row.precipitation_mm.toFixed(1)} mm`}
                  </div>
                  <div className="mt-1 text-xs text-ink/55">{row.precipitationState}</div>
                </div>
                <div className="rounded-[18px] border border-storm/15 bg-cloud/80 px-3 py-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-ink/40">Momentum</div>
                  <div className="mt-1 text-sm font-semibold text-ink">{formatDelta(row.delta)}</div>
                  <div className="mt-1 text-xs text-ink/55">Comfort score {row.comfortScore}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
