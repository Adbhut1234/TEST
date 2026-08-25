import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Supabase Client (For server-side, it's safe to use env vars directly)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: Request) {
  try {
    const { documentId } = await req.json()

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    // 1. Fetch document metadata
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      throw new Error(docError?.message || 'Document not found')
    }

    // Update status to EXTRACTING
    await supabase.from('documents').update({ processing_status: 'EXTRACTING' }).eq('id', documentId)

    // 2. Download the file from Supabase Storage
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from('land-records')
      .download(document.storage_path)

    if (downloadError || !fileBlob) {
      throw new Error(downloadError?.message || 'Failed to download file')
    }

    // Convert Blob to Base64
    const arrayBuffer = await fileBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Data = buffer.toString('base64')

    // 3. Call Gemini API
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" }
    })

    const prompt = `You are an expert Indian Land Record extractor.
Analyze the provided image of a land record.
Extract the following fields and return ONLY a valid JSON object matching this schema:
{
  "owner_name": "string or null",
  "khasra_number": "string or null",
  "land_area": "number or null",
  "village": "string or null"
}
If a field is unreadable, set it to null. Do not invent information.`

    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: document.source_type || 'image/jpeg'
        }
      }
    ]

    const result = await model.generateContent([prompt, ...imageParts])
    const text = result.response.text()
    
    let extractedData = {}
    try {
      extractedData = JSON.parse(text)
    } catch (e) {
      throw new Error('Gemini did not return valid JSON')
    }

    // --- MOCK FRAUD DETECTION LOGIC ---
    const validationFlags = []
    const kNumber = (extractedData as any).khasra_number || ''
    const lArea = parseFloat((extractedData as any).land_area || '0')

    if (kNumber.includes('999')) {
      validationFlags.push({
        type: 'CRITICAL',
        message: 'Khasra Number matches flagged registry. Potential fraud detected.'
      })
    }
    
    if (lArea > 50) {
      validationFlags.push({
        type: 'WARNING',
        message: 'Unusually large land area for a single holding.'
      })
    }

    // 4. Save to Land Records Table
    const { error: insertError } = await supabase
      .from('land_records')
      .insert([{
        document_id: documentId,
        extracted_data: extractedData,
        verified_data: extractedData,
        validation_flags: validationFlags
      }])

    if (insertError) {
      throw new Error(insertError.message)
    }

    // Update document status to REVIEW_REQUIRED
    await supabase
      .from('documents')
      .update({ processing_status: 'REVIEW_REQUIRED', processed_at: new Date().toISOString() })
      .eq('id', documentId)

    return NextResponse.json({ success: true, data: extractedData })

  } catch (error: any) {
    console.error('Processing Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
