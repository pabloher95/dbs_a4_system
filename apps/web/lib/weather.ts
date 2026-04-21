import type { WeatherHistoryPoint, WeatherSnapshot } from "./types";

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Heavy freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Heavy showers",
  82: "Violent showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Storm with hail",
  99: "Severe hail storm"
};

export function getWeatherCodeLabel(code: number) {
  return WEATHER_CODE_LABELS[code] ?? "Unknown";
}

export function buildTemperatureSeries(history: WeatherHistoryPoint[]) {
  const cityNames = Array.from(new Set(history.map((point) => point.city_name)));
  const byTime = new Map<string, Record<string, number | string>>();
  const axisTimeFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC"
  });

  for (const point of history) {
    const timeKey = point.observed_at;
    const row = byTime.get(timeKey) ?? {
      observedAt: point.observed_at,
      label: `${axisTimeFormatter.format(new Date(point.observed_at))} UTC`
    };

    row[point.city_name] = point.temperature_c;
    byTime.set(timeKey, row);
  }

  const chartData = Array.from(byTime.entries())
    .sort(([left], [right]) => new Date(left).getTime() - new Date(right).getTime())
    .map(([, row]) => row);

  return { chartData, cityNames };
}

export function buildInsightRows(latestSnapshots: WeatherSnapshot[], history: WeatherHistoryPoint[]) {
  const historyByCity = new Map<string, WeatherHistoryPoint[]>();

  for (const point of history) {
    const points = historyByCity.get(point.city_id) ?? [];
    points.push(point);
    historyByCity.set(point.city_id, points);
  }

  return latestSnapshots.map((snapshot) => {
    const points = [...(historyByCity.get(snapshot.city_id) ?? [])].sort(
      (left, right) => new Date(right.observed_at).getTime() - new Date(left.observed_at).getTime()
    );
    const previousPoint = points[1];
    const recentPoints = points.slice(0, 5);
    const delta = previousPoint ? snapshot.temperature_c - previousPoint.temperature_c : null;
    const volatility =
      recentPoints.length > 1
        ? Math.max(...recentPoints.map((point) => point.temperature_c)) -
          Math.min(...recentPoints.map((point) => point.temperature_c))
        : null;
    const trend =
      delta === null ? "steady" : delta > 0.7 ? "warming" : delta < -0.7 ? "cooling" : "steady";
    const feelsLikeGap =
      snapshot.apparent_temperature_c === null ? null : snapshot.apparent_temperature_c - snapshot.temperature_c;
    const comfortScore = scoreComfort(snapshot);

    return {
      ...snapshot,
      delta,
      volatility,
      trend,
      feelsLikeGap,
      comfortScore,
      precipitationState:
        snapshot.precipitation_mm === null
          ? "unknown"
          : snapshot.precipitation_mm >= 2
            ? "active rain"
            : snapshot.precipitation_mm > 0
              ? "trace precipitation"
              : "dry",
      condition: getWeatherCodeLabel(snapshot.weather_code)
    };
  });
}

export function summarizeWeather(latestSnapshots: WeatherSnapshot[], history: WeatherHistoryPoint[]) {
  const rows = buildInsightRows(latestSnapshots, history);

  if (rows.length === 0) {
    return {
      rows,
      hottest: null,
      coolest: null,
      breeziest: null,
      muggiest: null,
      wettest: null,
      bestOutdoors: null,
      mostVolatile: null,
      sharpestShift: null,
      spread: null,
      daylightCount: 0
    };
  }

  const hottest = rows.reduce((max, row) => (row.temperature_c > max.temperature_c ? row : max), rows[0]);
  const coolest = rows.reduce((min, row) => (row.temperature_c < min.temperature_c ? row : min), rows[0]);
  const breeziest = rows.reduce((max, row) => (row.wind_speed_kph > max.wind_speed_kph ? row : max), rows[0]);
  const muggiest =
    rows.filter((row) => row.relative_humidity !== null).sort((left, right) => (right.relative_humidity ?? 0) - (left.relative_humidity ?? 0))[0] ??
    null;
  const wettest =
    rows.filter((row) => row.precipitation_mm !== null).sort((left, right) => (right.precipitation_mm ?? 0) - (left.precipitation_mm ?? 0))[0] ??
    null;
  const bestOutdoors = [...rows].sort((left, right) => right.comfortScore - left.comfortScore)[0];
  const mostVolatile =
    rows
      .filter((row) => row.volatility !== null)
      .sort((left, right) => (right.volatility ?? 0) - (left.volatility ?? 0))[0] ?? null;
  const sharpestShift = rows
    .filter((row) => row.delta !== null)
    .sort((left, right) => Math.abs((right.delta ?? 0)) - Math.abs((left.delta ?? 0)))[0] ?? null;

  return {
    rows,
    hottest,
    coolest,
    breeziest,
    muggiest,
    wettest,
    bestOutdoors,
    mostVolatile,
    sharpestShift,
    spread: hottest.temperature_c - coolest.temperature_c,
    daylightCount: rows.filter((row) => row.is_day).length
  };
}

function scoreComfort(snapshot: WeatherSnapshot) {
  let score = 100;

  const comfortTempGap = Math.abs(snapshot.temperature_c - 21);
  score -= comfortTempGap * 2.1;
  score -= Math.max(snapshot.wind_speed_kph - 18, 0) * 0.8;

  if (snapshot.relative_humidity !== null) {
    score -= Math.max(snapshot.relative_humidity - 65, 0) * 0.45;
  }

  if (snapshot.apparent_temperature_c !== null) {
    score -= Math.abs(snapshot.apparent_temperature_c - snapshot.temperature_c) * 1.5;
  }

  if (snapshot.weather_code >= 61) {
    score -= 12;
  }

  if (snapshot.precipitation_mm !== null) {
    score -= snapshot.precipitation_mm * 7;
  }

  return Math.max(Math.round(score), 0);
}
