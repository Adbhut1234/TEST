-- 006_fix_auth_and_roles.sql
-- Run this in the Supabase SQL editor to fix the RBAC linking issue!

-- 1. Link your actual login accounts to the profiles table
-- (Because the seed script generated random Auth IDs that didn't match the profiles)
insert into public.profiles (id, email, name, role)
select id, email, 'System Admin', 'ADMIN' from auth.users where email = 'admin@india.gov.in'
on conflict (id) do update set role = 'ADMIN';

insert into public.profiles (id, email, name, role)
select id, email, 'Test Officer', 'VERIFICATION_OFFICER' from auth.users where email = 'officer@india.gov.in'
on conflict (id) do update set role = 'VERIFICATION_OFFICER';

-- 2. Optional Hackathon Quality-of-Life: Let Verifiers also upload!
-- During a fast 5-minute pitch, logging in and out of different accounts is annoying.
-- Let's just let the VERIFICATION_OFFICER upload documents too so you can do the whole demo from one screen.
drop policy if exists "RBAC: Operator and Admin can insert documents" on public.documents;

create policy "RBAC: Operator, Verifier, and Admin can insert documents" 
on public.documents for insert 
with check (public.get_my_role() in ('DIGITIZATION_OPERATOR', 'VERIFICATION_OFFICER', 'ADMIN'));
