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

async function writeSnapshot(city: City, payload: OpenMeteoResponse) {
  const current = payload.current;
  const sunrise = extractTime(payload.daily?.sunrise?.[0]);
  const sunset = extractTime(payload.daily?.sunset?.[0]);

  const { error } = await supabase.from("weather_snapshots").upsert(
    {
      city_id: city.id,
      observed_at: current.time,
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
