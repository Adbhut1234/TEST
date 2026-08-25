-- 002_security_and_audit.sql
-- Run this in the Supabase SQL editor to apply P0 and P1 security fixes.

-- 1. Soft Delete columns
alter table public.documents add column deleted_at timestamp with time zone;
alter table public.land_records add column deleted_at timestamp with time zone;

-- 2. Audit Events Table
create table public.audit_events (
  id uuid default uuid_generate_v4() primary key,
  land_record_id uuid references public.land_records(id) on delete cascade not null,
  actor_id uuid references public.profiles(id),
  field_name text not null,
  old_value text,
  new_value text,
  action text not null check (action in ('CORRECTION', 'APPROVE', 'REJECT', 'DELETE')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Lock down Row Level Security (RLS)
-- Drop existing public policies
drop policy if exists "Allow public full access to profiles" on public.profiles;
drop policy if exists "Allow public full access to documents" on public.documents;
drop policy if exists "Allow public full access to land_records" on public.land_records;
drop policy if exists "Allow public uploads" on storage.objects;
drop policy if exists "Allow public reads" on storage.objects;

-- Apply strict authenticated policies
-- Profiles: User can only read and update their own profile. Insert handled by signup flow/triggers or service role.
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Documents: Only authenticated users can access
create policy "Authenticated read/insert/update documents" on public.documents for all using (auth.role() = 'authenticated');

-- Land Records: Only authenticated users can access
create policy "Authenticated read/insert/update land_records" on public.land_records for all using (auth.role() = 'authenticated');

-- Audit Events: Only authenticated users can access
alter table public.audit_events enable row level security;
create policy "Authenticated read/insert audit_events" on public.audit_events for all using (auth.role() = 'authenticated');

-- Storage: Only authenticated users can upload/read land-records bucket
create policy "Authenticated uploads" on storage.objects for insert with check (bucket_id = 'land-records' and auth.role() = 'authenticated');
create policy "Authenticated reads" on storage.objects for select using (bucket_id = 'land-records' and auth.role() = 'authenticated');
