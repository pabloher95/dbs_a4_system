create or replace function public.get_latest_weather_for_user()
returns table (
  city_id uuid,
  city_name text,
  city_slug text,
  observed_at timestamptz,
  temperature_c numeric,
  apparent_temperature_c numeric,
  relative_humidity integer,
  wind_speed_kph numeric,
  wind_direction_deg numeric,
  weather_code integer,
  is_day boolean,
  precipitation_mm numeric,
  sunrise_local text,
  sunset_local text
)
language sql
security definer
set search_path = public
as $$
  select distinct on (c.id)
    c.id as city_id,
    c.name as city_name,
    c.slug as city_slug,
    ws.observed_at,
    ws.temperature_c,
    ws.apparent_temperature_c,
    ws.relative_humidity,
    ws.wind_speed_kph,
    ws.wind_direction_deg,
    ws.weather_code,
    ws.is_day,
    ws.precipitation_mm,
    ws.sunrise_local,
    ws.sunset_local
  from public.cities c
  join public.user_city_subscriptions ucs on ucs.city_id = c.id
  join public.weather_snapshots ws on ws.city_id = c.id
  where ucs.user_id = auth.uid()
  order by c.id, ws.observed_at desc;
$$;

grant execute on function public.get_latest_weather_for_user() to authenticated;

create or replace function public.get_recent_weather_history_for_user(limit_per_city integer default 8)
returns table (
  city_id uuid,
  city_name text,
  city_slug text,
  observed_at timestamptz,
  temperature_c numeric,
  apparent_temperature_c numeric,
  relative_humidity integer,
  wind_speed_kph numeric,
  wind_direction_deg numeric,
  weather_code integer,
  is_day boolean,
  precipitation_mm numeric,
  sunrise_local text,
  sunset_local text
)
language sql
security definer
set search_path = public
as $$
  with ranked_history as (
    select
      c.id as city_id,
      c.name as city_name,
      c.slug as city_slug,
      ws.observed_at,
      ws.temperature_c,
      ws.apparent_temperature_c,
      ws.relative_humidity,
      ws.wind_speed_kph,
      ws.wind_direction_deg,
      ws.weather_code,
      ws.is_day,
      ws.precipitation_mm,
      ws.sunrise_local,
      ws.sunset_local,
      row_number() over (partition by c.id order by ws.observed_at desc) as row_num
    from public.cities c
    join public.user_city_subscriptions ucs on ucs.city_id = c.id
    join public.weather_snapshots ws on ws.city_id = c.id
    where ucs.user_id = (select auth.uid())
  )
  select
    city_id,
    city_name,
    city_slug,
    observed_at,
    temperature_c,
    apparent_temperature_c,
    relative_humidity,
    wind_speed_kph,
    wind_direction_deg,
    weather_code,
    is_day,
    precipitation_mm,
    sunrise_local,
    sunset_local
  from ranked_history
  where row_num <= greatest(limit_per_city, 1)
  order by city_name, observed_at;
$$;

grant execute on function public.get_recent_weather_history_for_user(integer) to authenticated;
