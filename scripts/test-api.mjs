import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function run() {
  // Get latest document
  const { data, error } = await supabase.from('documents').select('*').order('uploaded_at', { ascending: false }).limit(1)
  
  if (error || !data || data.length === 0) {
    console.error("No documents found or error:", error)
    return
  }
  
  const docId = data[0].id
  console.log("Found document:", docId)
  
  // Direct Supabase download test
  console.log("Downloading from Supabase:", data[0].storage_path)
  const { data: fileBlob, error: downloadError } = await supabase.storage.from('land-records').download(data[0].storage_path)
  
  if (downloadError) {
    console.error("Download Error:", downloadError)
    return
  }
  
  const arrayBuffer = await fileBlob.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64Data = buffer.toString('base64')
  
  console.log("Downloaded successfully. Size:", base64Data.length)
  
  // Direct Gemini test
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })
  
  console.log("Calling Gemini...")
  try {
    const result = await model.generateContent([
      "Extract information as JSON", 
      { inlineData: { data: base64Data, mimeType: data[0].source_type || 'image/jpeg' } }
    ])
    console.log("Gemini response:", result.response.text())
  } catch (err) {
    console.error("Gemini Error:", err)
  }
  
  process.exit(0)

}

run()
