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
