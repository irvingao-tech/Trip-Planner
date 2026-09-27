create extension if not exists pgcrypto;

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  timezone text not null default 'Asia/Tokyo',
  currency text not null default 'JPY',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  provider_place_id text,
  name text not null,
  name_local text,
  category text not null,
  priority text not null check (priority in ('must','want','optional')),
  latitude double precision not null,
  longitude double precision not null,
  address text,
  region text,
  visit_duration_minutes integer not null default 60 check (visit_duration_minutes > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  date date not null,
  start_time time not null default '08:30',
  end_time time not null default '20:00',
  pace text not null default 'normal',
  walking_preference text not null default 'normal',
  unique(trip_id, date)
);

create table public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_day_id uuid not null references public.trip_days(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  order_index integer not null,
  fixed boolean not null default false,
  fixed_start_at timestamptz,
  planned_arrival_at timestamptz,
  planned_departure_at timestamptz,
  status text not null default 'planned',
  unique(trip_day_id, place_id)
);

create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  category text,
  preferred_place_id uuid references public.places(id) on delete set null,
  store_name text,
  estimated_price numeric,
  currency text default 'JPY',
  purchased boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.trips enable row level security;
alter table public.places enable row level security;
alter table public.trip_days enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.shopping_items enable row level security;

create policy "trip owner access"
on public.trips
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "place via trip owner"
on public.places
for all
using (
  exists (
    select 1 from public.trips t
    where t.id = places.trip_id
      and t.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.trips t
    where t.id = places.trip_id
      and t.owner_id = auth.uid()
  )
);

create policy "trip_day via trip owner"
on public.trip_days
for all
using (
  exists (
    select 1 from public.trips t
    where t.id = trip_days.trip_id
      and t.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.trips t
    where t.id = trip_days.trip_id
      and t.owner_id = auth.uid()
  )
);

create policy "itinerary via trip owner"
on public.itinerary_items
for all
using (
  exists (
    select 1
    from public.trip_days d
    join public.trips t on t.id = d.trip_id
    where d.id = itinerary_items.trip_day_id
      and t.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trip_days d
    join public.trips t on t.id = d.trip_id
    where d.id = itinerary_items.trip_day_id
      and t.owner_id = auth.uid()
  )
);

create policy "shopping via trip owner"
on public.shopping_items
for all
using (
  exists (
    select 1 from public.trips t
    where t.id = shopping_items.trip_id
      and t.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.trips t
    where t.id = shopping_items.trip_id
      and t.owner_id = auth.uid()
  )
);
