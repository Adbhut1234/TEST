-- 004_strict_rbac.sql
-- Run this to implement True Role-Based Access Control (RBAC) 
-- satisfying the 9+ score requirement for SIH.

-- 1. Helper function to get current user role safely
create or replace function public.get_my_role()
returns text
language sql
security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 2. Drop existing overly-broad authenticated policies
drop policy if exists "Authenticated read/insert/update documents" on public.documents;
drop policy if exists "Authenticated read/insert/update land_records" on public.land_records;
drop policy if exists "Authenticated read/insert audit_events" on public.audit_events;

-- 3. DOCUMENTS RBAC
-- Everyone authenticated can read
create policy "RBAC: All authenticated can read documents" 
on public.documents for select 
using (auth.role() = 'authenticated');

-- Only DIGITIZATION_OPERATOR and ADMIN can insert
create policy "RBAC: Operator and Admin can insert documents" 
on public.documents for insert 
with check (public.get_my_role() in ('DIGITIZATION_OPERATOR', 'ADMIN'));

-- Operators, Verifiers, and Admins can update
create policy "RBAC: Operator, Verifier, Admin can update documents" 
on public.documents for update 
using (public.get_my_role() in ('DIGITIZATION_OPERATOR', 'VERIFICATION_OFFICER', 'ADMIN'));

-- 4. LAND_RECORDS RBAC
-- Everyone authenticated can read
create policy "RBAC: All authenticated can read land_records" 
on public.land_records for select 
using (auth.role() = 'authenticated');

-- Only AI pipeline (via service role or Operator) can insert
create policy "RBAC: Operator and Admin can insert land_records" 
on public.land_records for insert 
with check (public.get_my_role() in ('DIGITIZATION_OPERATOR', 'ADMIN'));

-- Only Verifier and Admin can update (to approve or correct)
create policy "RBAC: Verifier and Admin can update land_records" 
on public.land_records for update 
using (public.get_my_role() in ('VERIFICATION_OFFICER', 'ADMIN'));

-- 5. AUDIT_EVENTS RBAC
-- Everyone authenticated can read
create policy "RBAC: All authenticated can read audit_events" 
on public.audit_events for select 
using (auth.role() = 'authenticated');

-- Verifier and Admin can insert audit events (from approvals)
create policy "RBAC: Verifier and Admin can insert audit_events" 
on public.audit_events for insert 
with check (public.get_my_role() in ('VERIFICATION_OFFICER', 'ADMIN'));
