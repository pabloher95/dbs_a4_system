import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const currentDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(currentDir, "../.env"), override: true });

type City = {
  id: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

type OpenMeteoCurrent = {
  time: string;
  interval: number;
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  precipitation: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  weather_code: number;
  is_day: number;
};

type OpenMeteoDaily = {
  time: string[];
  sunrise: string[];
  sunset: string[];
};

type OpenMeteoResponse = {
  current: OpenMeteoCurrent;
  daily: OpenMeteoDaily;
  utc_offset_seconds?: number;
};

type PreviousSnapshot = {
  observed_at: string;
  temperature_c: number;
  precipitation_mm: number | null;
  wind_speed_kph: number;
  relative_humidity: number | null;
};

type NowcastEventInsert = {
  city_id: string;
  event_type: string;
  severity: "info" | "watch" | "warning";
  title: string;
  detail: string;
  metric_value: number | null;
  observed_at: string;
};

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SECRET_KEY"] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const baseUrl = process.env.OPEN_METEO_BASE_URL ?? "https://api.open-meteo.com/v1/forecast";
const pollIntervalMs = Number(process.env.WEATHER_POLL_INTERVAL_MS ?? 300000);

async function fetchCities() {
  const { data, error } = await supabase
    .from("cities")
    .select("id, slug, name, latitude, longitude, timezone")
    .order("name");

  if (error) {
    throw error;
  }

  return data as City[];
}

async function fetchWeatherForCity(city: City) {
  const url = new URL(baseUrl);
  url.searchParams.set("latitude", String(city.latitude));
  url.searchParams.set("longitude", String(city.longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code,is_day"
  );
  url.searchParams.set("daily", "sunrise,sunset");
  url.searchParams.set("timezone", city.timezone);
  url.searchParams.set("forecast_days", "1");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed for ${city.slug}: ${response.status}`);
  }

  const payload = (await response.json()) as OpenMeteoResponse;
  return payload;
}

function extractTime(isoString: string | undefined): string | null {
  if (!isoString) return null;
  const parts = isoString.split("T");
  return parts[1] ?? null;
}

function toFixedNumber(value: number, digits = 1) {
  return Number(value.toFixed(digits));
}

async function fetchPreviousSnapshot(cityId: string) {
  const { data, error } = await supabase
    .from("weather_snapshots")
    .select("observed_at, temperature_c, precipitation_mm, wind_speed_kph, relative_humidity")
    .eq("city_id", cityId)
    .order("observed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as PreviousSnapshot | null) ?? null;
}

function buildNowcastEvents(city: City, previous: PreviousSnapshot | null, payload: OpenMeteoResponse, observedAtUtc: string) {
  const events: NowcastEventInsert[] = [];
  const current = payload.current;
  const previousPrecip = previous?.precipitation_mm ?? 0;
  const currentPrecip = current.precipitation ?? 0;
  const previousWind = previous?.wind_speed_kph ?? 0;
  const previousHumidity = previous?.relative_humidity ?? 0;
  const previousTemp = previous?.temperature_c ?? current.temperature_2m;
  const tempDelta = current.temperature_2m - previousTemp;

  if (previous && previousPrecip <= 0.1 && currentPrecip > 0.2) {
    events.push({
      city_id: city.id,
      event_type: "rain_started",
      severity: "watch",
      title: `${city.name}: rain started`,
      detail: `Precipitation reached ${toFixedNumber(currentPrecip)} mm.`,
      metric_value: toFixedNumber(currentPrecip),
      observed_at: observedAtUtc
    });
  }

  if (previous && previousPrecip > 0.2 && currentPrecip <= 0.1) {
    events.push({
      city_id: city.id,
      event_type: "rain_stopped",
      severity: "info",
      title: `${city.name}: rain eased`,
      detail: "Precipitation dropped back near zero.",
      metric_value: toFixedNumber(currentPrecip),
      observed_at: observedAtUtc
    });
  }

  if (Math.abs(tempDelta) >= 2) {
    events.push({
      city_id: city.id,
      event_type: "temperature_jump",
      severity: Math.abs(tempDelta) >= 4 ? "warning" : "watch",
      title: `${city.name}: sharp temperature move`,
      detail: `${tempDelta > 0 ? "Up" : "Down"} ${toFixedNumber(Math.abs(tempDelta))}°C since last reading.`,
      metric_value: toFixedNumber(tempDelta),
      observed_at: observedAtUtc
    });
  }

  if (current.wind_speed_10m >= 30 && previousWind < 30) {
    events.push({
      city_id: city.id,
      event_type: "wind_threshold",
      severity: current.wind_speed_10m >= 40 ? "warning" : "watch",
      title: `${city.name}: wind picked up`,
      detail: `Winds reached ${toFixedNumber(current.wind_speed_10m)} kph.`,
      metric_value: toFixedNumber(current.wind_speed_10m),
      observed_at: observedAtUtc
    });
  }

  if (current.relative_humidity_2m >= 85 && previousHumidity < 85) {
    events.push({
      city_id: city.id,
      event_type: "humidity_spike",
      severity: "info",
      title: `${city.name}: humidity spike`,
      detail: `Humidity is now ${current.relative_humidity_2m}%.`,
      metric_value: current.relative_humidity_2m,
      observed_at: observedAtUtc
    });
  }

  const windDelta = Math.abs(current.wind_speed_10m - previousWind);
  const humidityDelta = Math.abs(current.relative_humidity_2m - previousHumidity);

  if (
    previous &&
    events.length === 0 &&
    (Math.abs(tempDelta) >= 0.5 || windDelta >= 5 || humidityDelta >= 8)
  ) {
    events.push({
      city_id: city.id,
      event_type: "conditions_shift",
      severity: "info",
      title: `${city.name}: conditions shifted`,
      detail: `Temp ${tempDelta >= 0 ? "+" : ""}${toFixedNumber(tempDelta)}°C, wind ${toFixedNumber(
        current.wind_speed_10m
      )} kph.`,
      metric_value: toFixedNumber(tempDelta),
      observed_at: observedAtUtc
    });
  }

  return events;
}

async function writeSnapshot(city: City, payload: OpenMeteoResponse) {
  const current = payload.current;
  const sunrise = extractTime(payload.daily?.sunrise?.[0]);
  const sunset = extractTime(payload.daily?.sunset?.[0]);
  const utcOffsetSeconds = payload.utc_offset_seconds ?? 0;
  const observedAtUtc = new Date(new Date(`${current.time}Z`).getTime() - utcOffsetSeconds * 1000).toISOString();
  const previousSnapshot = await fetchPreviousSnapshot(city.id);

  const { error } = await supabase.from("weather_snapshots").upsert(
    {
      city_id: city.id,
      observed_at: observedAtUtc,
      temperature_c: current.temperature_2m,
      apparent_temperature_c: current.apparent_temperature,
      relative_humidity: current.relative_humidity_2m,
      precipitation_mm: current.precipitation,
      wind_speed_kph: current.wind_speed_10m,
      wind_direction_deg: current.wind_direction_10m,
      weather_code: current.weather_code,
      is_day: Boolean(current.is_day),
      sunrise_local: sunrise,
      sunset_local: sunset,
      raw_payload: payload
    },
    {
      onConflict: "city_id,observed_at"
    }
  );

  if (error) {
    throw error;
  }

  const nowcastEvents = buildNowcastEvents(city, previousSnapshot, payload, observedAtUtc);

  if (nowcastEvents.length > 0) {
    const { error: eventError } = await supabase.from("nowcast_events").insert(nowcastEvents);
    if (eventError) {
      throw eventError;
    }
  }
}

async function pollOnce() {
  const cities = await fetchCities();

  await Promise.all(
    cities.map(async (city) => {
      const payload = await fetchWeatherForCity(city);
      await writeSnapshot(city, payload);
      console.log(`[worker] wrote snapshot for ${city.slug} at ${payload.current.time}`);
    })
  );
}

async function main() {
  console.log(`[worker] starting polling loop every ${pollIntervalMs}ms`);

  await pollOnce();

  setInterval(() => {
    void pollOnce().catch((error) => {
      console.error("[worker] poll failed", error);
    });
  }, pollIntervalMs);
}

void main().catch((error) => {
  console.error("[worker] fatal error", error);
  process.exitCode = 1;
});
