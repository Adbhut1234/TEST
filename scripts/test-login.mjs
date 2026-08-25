import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function run() {
  console.log("Testing login...")
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'officer@india.gov.in',
    password: 'password123',
  })
  
  if (error) {
    console.error("Login Error:", error.message)
  } else {
    console.log("Login Success!", data.session?.access_token.substring(0, 10))
  }
}

run()
