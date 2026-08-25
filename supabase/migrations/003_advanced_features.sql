-- 003_advanced_features.sql

-- 1. Create a mock LRMS (Land Record Management System) table for integration demo
create table public.mock_lrms_records (
  id uuid default uuid_generate_v4() primary key,
  owner_name text,
  khasra_number text,
  khata_number text,
  village text,
  tehsil text,
  district text,
  plot_area text
);

alter table public.mock_lrms_records enable row level security;
create policy "Authenticated read mock_lrms" on public.mock_lrms_records for select using (auth.role() = 'authenticated');

-- Insert some mock records for testing validation engine
insert into public.mock_lrms_records (owner_name, khasra_number, khata_number, village, tehsil, district, plot_area) 
select * from (values 
  ('Rajesh Kumar Sharma', '452/1', 'Unknown', 'Rampur', 'Palampur', 'Kangra', '1.5 Hectares'),
  ('Ramesh Kumar', '128/2', '45A', 'Bhatagaon', 'Raipur', 'Raipur', '1.25'),
  ('Suresh Verma', '999', '12B', 'Gokulpur', 'Bhopal', 'Bhopal', '5.00')
) as v(owner_name, khasra_number, khata_number, village, tehsil, district, plot_area)
where not exists (select 1 from public.mock_lrms_records where khasra_number = '452/1');

-- 2. Prevent duplicate land_records per document (Risk 1 Fix)
alter table public.land_records add constraint unique_document_id unique(document_id);

-- 3. Make audit trail truly immutable (Risk 3 Fix)
-- First drop the broad policy from 002
drop policy if exists "Authenticated read/insert audit_events" on public.audit_events;

-- Create strict select/insert only policies
create policy "Authenticated can read audit_events" on public.audit_events for select using (auth.role() = 'authenticated');
create policy "Authenticated can insert audit_events" on public.audit_events for insert with check (auth.role() = 'authenticated');
-- Note: No UPDATE or DELETE policies are created, making rows effectively immutable.
