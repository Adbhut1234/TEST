-- 006_fix_auth_and_roles.sql
-- Run this in the Supabase SQL editor to fix the RBAC linking issue!

-- 1. Link ALL existing Auth accounts to the profiles table as ADMIN
-- (This guarantees whoever you are logged in as will have the correct permissions for the demo)
insert into public.profiles (id, email, name, role)
select id, email, 'System Admin', 'ADMIN' from auth.users
on conflict (id) do update set role = 'ADMIN';

-- 2. Optional Hackathon Quality-of-Life: Let Verifiers also upload!
-- Drop the policy first to prevent the "policy already exists" error when re-running
drop policy if exists "RBAC: Operator and Admin can insert documents" on public.documents;
drop policy if exists "RBAC: Operator, Verifier, and Admin can insert documents" on public.documents;

create policy "RBAC: Operator, Verifier, and Admin can insert documents" 
on public.documents for insert 
with check (public.get_my_role() in ('DIGITIZATION_OPERATOR', 'VERIFICATION_OFFICER', 'ADMIN'));
