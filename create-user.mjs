import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function run() {
  console.log("Attempting to create a test user...")
  const { data, error } = await supabase.auth.signUp({
    email: 'officer@india.gov.in',
    password: 'password123',
  })
  
  if (error) {
    console.error("Error creating user:", error.message)
  } else {
    console.log("User created successfully!")
    console.log("Email:", 'officer@india.gov.in')
    console.log("Password:", 'password123')
    console.log("Note: If email confirmations are enabled in your Supabase project, you might still need to verify the email or disable confirmations in the Supabase Dashboard.")
  }
}

run()
