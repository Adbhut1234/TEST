import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  console.log("🚀 Starting Demo Data Seeder...")

  // 1. Create an ADMIN user
  console.log("👤 Creating Admin User (admin@india.gov.in / password123)...")
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'admin@india.gov.in',
    password: 'password123',
  })
  
  if (authError && authError.message !== 'User already registered') {
     console.error("Auth Error:", authError)
     return;
  }

  // 2. Sign in to get JWT token
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'admin@india.gov.in',
    password: 'password123'
  })

  if (loginError) {
    console.error("Login Error:", loginError)
    return;
  }

  const token = loginData.session.access_token;
  const adminId = loginData.user.id;

  // Initialize Admin Client
  const adminSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  // 3. Make sure the user is an ADMIN in the profiles table
  await adminSupabase.from('profiles').upsert({
    id: adminId,
    name: 'System Admin',
    email: 'admin@india.gov.in',
    role: 'ADMIN'
  })

  console.log("✅ Admin user ready. Seeding records...")

  // 4. Generate Demo Documents
  const docsToInsert = [
    { filename: 'lucknow_khasra_89.pdf', source_type: 'application/pdf', processing_status: 'VERIFIED', storage_path: 'demo/1', uploaded_by: adminId },
    { filename: 'patna_scan_v2.jpg', source_type: 'image/jpeg', processing_status: 'REVIEW_REQUIRED', storage_path: 'demo/2', uploaded_by: adminId },
    { filename: 'bhopal_legacy_record.png', source_type: 'image/png', processing_status: 'REVIEW_REQUIRED', storage_path: 'demo/3', uploaded_by: adminId },
    { filename: 'raipur_plot_12.pdf', source_type: 'application/pdf', processing_status: 'VERIFIED', storage_path: 'demo/4', uploaded_by: adminId },
    { filename: 'lucknow_disputed_33.pdf', source_type: 'application/pdf', processing_status: 'FAILED', storage_path: 'demo/5', uploaded_by: adminId },
    { filename: 'delhi_new_registry.jpg', source_type: 'image/jpeg', processing_status: 'EXTRACTING', storage_path: 'demo/6', uploaded_by: adminId }
  ]

  const { data: insertedDocs, error: docError } = await adminSupabase
    .from('documents')
    .insert(docsToInsert)
    .select()

  if (docError) {
    console.error("❌ Failed to insert documents. Did you run the SQL migrations?", docError)
    return;
  }

  // 5. Generate Demo Land Records (Mapping to the documents)
  const recordsToInsert = [
    {
      document_id: insertedDocs[0].id,
      is_verified: true,
      confidence_score: 0.98,
      verified_data: { owner_name: 'Rajesh Sharma', khasra_number: '89', plot_area: '1.2', district: 'Lucknow', village: 'Gomti Nagar' },
      extracted_data: { owner_name: { value: 'Rajesh Sharma', confidence: 0.99 }, district: { value: 'Lucknow', confidence: 0.95 } }
    },
    {
      document_id: insertedDocs[1].id,
      is_verified: false,
      confidence_score: 0.72,
      validation_flags: [{ type: 'WARNING', message: 'Low confidence on Owner Name' }],
      extracted_data: { 
        owner_name: { value: 'Amit Kmar', raw_value: 'अमित कुमार', confidence: 0.65 }, 
        khasra_number: { value: '45/B', confidence: 0.90 }, 
        district: { value: 'Patna', confidence: 0.88 },
        plot_area: { value: '0.8', confidence: 0.70 }
      }
    },
    {
      document_id: insertedDocs[2].id,
      is_verified: false,
      confidence_score: 0.85,
      validation_flags: [{ type: 'CRITICAL', message: 'Area mismatch with LRMS' }],
      extracted_data: { 
        owner_name: { value: 'Suresh Patel', confidence: 0.95 }, 
        khasra_number: { value: '112', confidence: 0.99 }, 
        district: { value: 'Bhopal', confidence: 0.95 },
        plot_area: { value: '5.0', confidence: 0.82 }
      }
    },
    {
      document_id: insertedDocs[3].id,
      is_verified: true,
      confidence_score: 0.94,
      verified_data: { owner_name: 'Vikram Singh', khasra_number: '12', plot_area: '2.5', district: 'Raipur', village: 'Civil Lines' },
      extracted_data: { owner_name: { value: 'Vikram Singh', confidence: 0.92 }, district: { value: 'Raipur', confidence: 0.96 } }
    }
  ]

  const { error: recError } = await adminSupabase
    .from('land_records')
    .insert(recordsToInsert)

  if (recError) {
    console.error("❌ Failed to insert land records.", recError)
    return;
  }

  console.log("🎉 SUCCESS! Sample data has been successfully generated in your database.")
  console.log("\n🔑 Use these credentials to log in and see the populated dashboard:")
  console.log("Email: admin@india.gov.in")
  console.log("Password: password123")
}

run()
