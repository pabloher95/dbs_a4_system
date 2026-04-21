export type City = {
  id: string;
  slug: string;
  name: string;
  country_code: string;
  timezone: string;
};

export type WeatherSnapshot = {
  city_id: string;
  city_name: string;
  city_slug: string;
  observed_at: string;
  temperature_c: number;
  apparent_temperature_c: number | null;
  relative_humidity: number | null;
  precipitation_mm: number | null;
  wind_speed_kph: number;
  wind_direction_deg: number;
  weather_code: number;
  is_day: boolean;
  sunrise_local: string | null;
  sunset_local: string | null;
};

export type WeatherHistoryPoint = WeatherSnapshot;

export type NowcastEvent = {
  id: string;
  city_id: string;
  city_name: string;
  city_slug: string;
  event_type: string;
  severity: "info" | "watch" | "warning";
  title: string;
  detail: string;
  metric_value: number | null;
  observed_at: string;
  created_at: string;
};
