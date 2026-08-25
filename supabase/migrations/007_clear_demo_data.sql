-- 007_clear_demo_data.sql
-- Run this in your Supabase SQL Editor right before your pitch!
-- This will wipe all uploaded documents, extractions, and audits to give you a 100% clean dashboard.

-- Note: This will NOT delete your user accounts, roles, or the mock LRMS government database.

delete from public.audit_events;
delete from public.land_records;
delete from public.documents;

-- Optional: If you want to reset the auto-increment counters (if any), though UUIDs are used here.
