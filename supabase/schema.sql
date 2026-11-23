-- Run once in your Supabase project's SQL Editor.
-- Reservation requests are private. The public must never read them directly.
create extension if not exists pgcrypto;
create table if not exists public.reservation_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null,
  phone text not null,
  preferred_date date not null,
  preferred_time time without time zone not null,
  guest_count integer not null check (guest_count between 1 and 12),
  special_requests text not null default '',
  consent_recorded_at timestamptz not null,
  status text not null default 'pending' check(status in ('pending','confirmed','declined','cancelled')),
  staff_notes text not null default ''
);
create index if not exists idx_reservation_requests_date_status on public.reservation_requests(preferred_date,status);
alter table public.reservation_requests enable row level security;
-- No public (anon/authenticated) policies on the table.
revoke all on public.reservation_requests from anon,authenticated;
-- Only server-side secret-key access may create and manage requests.
grant select,insert,update,delete on public.reservation_requests to service_role;
comment on table public.reservation_requests is 'Private customer reservation enquiries. Staff must confirm manually before a booking is final.';
