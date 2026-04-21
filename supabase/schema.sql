create extension if not exists pgcrypto;

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country_code text not null,
  latitude double precision not null,
  longitude double precision not null,
  timezone text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_city_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, city_id)
);

create table if not exists public.weather_snapshots (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  observed_at timestamptz not null,
  temperature_c numeric(5,2) not null,
  apparent_temperature_c numeric(5,2),
  relative_humidity integer,
  wind_speed_kph numeric(5,2) not null,
  wind_direction_deg numeric(5,2) not null,
  weather_code integer not null,
  is_day boolean not null,
  raw_payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (city_id, observed_at)
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'weather_snapshots'
  ) then
    alter publication supabase_realtime add table public.weather_snapshots;
  end if;
end
$$;

alter table public.cities enable row level security;
alter table public.user_city_subscriptions enable row level security;
alter table public.weather_snapshots enable row level security;

create policy "cities are readable by authenticated users"
on public.cities
for select
to authenticated
using (true);

create policy "users can read their subscriptions"
on public.user_city_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

create policy "users can manage their subscriptions"
on public.user_city_subscriptions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users can delete their subscriptions"
on public.user_city_subscriptions
for delete
to authenticated
using (auth.uid() = user_id);

create policy "users can read snapshots for subscribed cities"
on public.weather_snapshots
for select
to authenticated
using (
  exists (
    select 1
    from public.user_city_subscriptions ucs
    where ucs.city_id = weather_snapshots.city_id
      and ucs.user_id = auth.uid()
  )
);

insert into public.cities (slug, name, country_code, latitude, longitude, timezone)
values
  ('new-york-city', 'New York City', 'US', 40.7128, -74.0060, 'America/New_York'),
  ('tokyo', 'Tokyo', 'JP', 35.6762, 139.6503, 'Asia/Tokyo'),
  ('buenos-aires', 'Buenos Aires', 'AR', -34.6037, -58.3816, 'America/Argentina/Buenos_Aires'),
  ('mexico-city', 'Mexico City', 'MX', 19.4326, -99.1332, 'America/Mexico_City'),
  ('berlin', 'Berlin', 'DE', 52.5200, 13.4050, 'Europe/Berlin')
on conflict (slug) do update
set
  name = excluded.name,
  country_code = excluded.country_code,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  timezone = excluded.timezone;
