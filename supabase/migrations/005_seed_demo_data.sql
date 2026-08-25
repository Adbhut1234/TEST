-- 005_seed_demo_data.sql
-- Run this in your Supabase SQL Editor to instantly populate the dashboard

-- 1. Create the Demo Users in profiles (Bypasses Auth flow for demo purposes)
-- We use static UUIDs so we can reliably link them.
do $$ 
declare
  admin_id uuid := '11111111-1111-1111-1111-111111111111';
  verifier_id uuid := '22222222-2222-2222-2222-222222222222';
begin
  insert into public.profiles (id, name, email, role) 
  values 
    (admin_id, 'System Admin', 'admin@india.gov.in', 'ADMIN'),
    (verifier_id, 'Test Officer', 'officer@india.gov.in', 'VERIFICATION_OFFICER')
  on conflict (id) do update set role = excluded.role;

  -- 2. Clear old demo records to avoid duplicates if re-run
  delete from public.documents where uploaded_by = admin_id;

  -- 3. Insert Documents
  insert into public.documents (id, filename, storage_path, source_type, processing_status, uploaded_by)
  values 
    ('a0000000-0000-0000-0000-000000000001', 'lucknow_khasra_89.pdf', 'demo/1', 'application/pdf', 'VERIFIED', admin_id),
    ('a0000000-0000-0000-0000-000000000002', 'patna_scan_v2.jpg', 'demo/2', 'image/jpeg', 'REVIEW_REQUIRED', admin_id),
    ('a0000000-0000-0000-0000-000000000003', 'bhopal_legacy_record.png', 'demo/3', 'image/png', 'REVIEW_REQUIRED', admin_id),
    ('a0000000-0000-0000-0000-000000000004', 'raipur_plot_12.pdf', 'demo/4', 'application/pdf', 'VERIFIED', admin_id),
    ('a0000000-0000-0000-0000-000000000005', 'lucknow_disputed_33.pdf', 'demo/5', 'application/pdf', 'FAILED', admin_id),
    ('a0000000-0000-0000-0000-000000000006', 'delhi_new_registry.jpg', 'demo/6', 'image/jpeg', 'EXTRACTING', admin_id);

  -- 4. Insert Land Records
  insert into public.land_records (document_id, is_verified, confidence_score, validation_flags, extracted_data, verified_data)
  values
    (
      'a0000000-0000-0000-0000-000000000001', 
      true, 
      0.98, 
      '[]'::jsonb, 
      '{"owner_name": {"value": "Rajesh Sharma", "confidence": 0.99}, "district": {"value": "Lucknow", "confidence": 0.95}}'::jsonb,
      '{"owner_name": "Rajesh Sharma", "khasra_number": "89", "plot_area": "1.2", "district": "Lucknow", "village": "Gomti Nagar"}'::jsonb
    ),
    (
      'a0000000-0000-0000-0000-000000000002', 
      false, 
      0.72, 
      '[{"type": "WARNING", "message": "Low confidence on Owner Name"}]'::jsonb, 
      '{"owner_name": {"value": "Amit Kmar", "raw_value": "अमित कुमार", "confidence": 0.65}, "khasra_number": {"value": "45/B", "confidence": 0.90}, "district": {"value": "Patna", "confidence": 0.88}, "plot_area": {"value": "0.8", "confidence": 0.70}}'::jsonb,
      null
    ),
    (
      'a0000000-0000-0000-0000-000000000003', 
      false, 
      0.85, 
      '[{"type": "CRITICAL", "message": "Area mismatch with LRMS"}]'::jsonb, 
      '{"owner_name": {"value": "Suresh Patel", "confidence": 0.95}, "khasra_number": {"value": "112", "confidence": 0.99}, "district": {"value": "Bhopal", "confidence": 0.95}, "plot_area": {"value": "5.0", "confidence": 0.82}}'::jsonb,
      null
    ),
    (
      'a0000000-0000-0000-0000-000000000004', 
      true, 
      0.94, 
      '[]'::jsonb, 
      '{"owner_name": {"value": "Vikram Singh", "confidence": 0.92}, "district": {"value": "Raipur", "confidence": 0.96}}'::jsonb,
      '{"owner_name": "Vikram Singh", "khasra_number": "12", "plot_area": "2.5", "district": "Raipur", "village": "Civil Lines"}'::jsonb
    );

end $$;
