-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  role text check (role in ('ADMIN', 'DIGITIZATION_OPERATOR', 'VERIFICATION_OFFICER', 'READ_ONLY')),
  status text default 'ACTIVE',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Documents Table
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  filename text not null,
  source_type text,
  storage_path text not null,
  checksum text,
  page_count integer,
  processing_status text default 'UPLOADED' check (processing_status in ('UPLOADED', 'EXTRACTING', 'REVIEW_REQUIRED', 'VERIFIED', 'FAILED')),
  uploaded_by uuid references public.profiles(id),
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_at timestamp with time zone,
  error_code text,
  error_message text
);

-- 3. Land Records (Combines extracted and verified data for Gemini Hack)
create table public.land_records (
  id uuid default uuid_generate_v4() primary key,
  document_id uuid references public.documents(id) on delete cascade not null,
  extracted_data jsonb default '{}'::jsonb,
  verified_data jsonb default '{}'::jsonb,
  confidence_score numeric,
  validation_flags jsonb default '[]'::jsonb,
  is_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Storage Bucket configuration (Creates the bucket if it doesn't exist)
insert into storage.buckets (id, name, public) values ('land-records', 'land-records', false) on conflict do nothing;

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.land_records enable row level security;

-- Basic Policies (In a real app, restrict by role. For MVP, allow public access)
create policy "Allow public full access to profiles" on public.profiles for all using (true);
create policy "Allow public full access to documents" on public.documents for all using (true);
create policy "Allow public full access to land_records" on public.land_records for all using (true);

-- Storage Policies
create policy "Allow public uploads" on storage.objects for insert with check (bucket_id = 'land-records');
create policy "Allow public reads" on storage.objects for select using (bucket_id = 'land-records');
