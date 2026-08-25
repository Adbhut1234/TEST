'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle2, Save, Trash2, AlertCircle, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

const fieldLabels: Record<string, string> = {
  owner_name: "Owner Name",
  father_or_spouse_name: "Father/Spouse Name",
  khasra_number: "Khasra Number",
  khata_number: "Khata Number",
  survey_number: "Survey Number",
  plot_area: "Plot Area",
  area_unit: "Area Unit",
  village: "Village",
  tehsil: "Tehsil",
  district: "District",
  land_classification: "Land Classification",
  mutation_number: "Mutation Number",
  registration_date: "Registration Date"
}

export default function VerificationPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string

  const [document, setDocument] = useState<any>(null)
  const [record, setRecord] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!documentId) return
      setLoading(true)

      try {
        // 1. Fetch document
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single()

        if (docError) throw docError
        setDocument(docData)

        // Fetch file URL securely using Signed URL
        const { data: fileData, error: signedUrlError } = await supabase.storage
          .from('land-records')
          .createSignedUrl(docData.storage_path, 60 * 10) // 10 minutes

        if (signedUrlError) {
          console.error('Error generating signed URL:', signedUrlError)
        }
        setFileUrl(fileData?.signedUrl || null)

        // 2. Fetch land record
        const { data: recordData, error: recordError } = await supabase
          .from('land_records')
          .select('*')
          .eq('document_id', documentId)
          .single()

        if (recordError && recordError.code !== 'PGRST116') {
          throw recordError
        }

        if (recordData) {
          setRecord(recordData)
          const isVerified = recordData.is_verified;
          const dataToUse = isVerified ? (recordData.verified_data || {}) : (recordData.extracted_data || {})
          
          const initialFormData: Record<string, string> = {}
          Object.keys(fieldLabels).forEach(f => {
            if (isVerified) {
              initialFormData[f] = dataToUse[f] || ''
            } else {
              initialFormData[f] = dataToUse[f]?.value || ''
            }
          })
          setFormData(initialFormData)
        }
      } catch (error) {
        console.error('Error loading verification data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [documentId])

  const handleVerify = async () => {
    if (!record) return
    setSaving(true)

    try {
      // Get current user for audit logs
      const { data: { session } } = await supabase.auth.getSession()
      const actorId = session?.user?.id

      const auditEvents = []
      
      // Check each field for corrections against original extracted value
      const fields = Object.keys(fieldLabels)
      for (const field of fields) {
        const oldVal = record.extracted_data?.[field]?.value || ''
        const newVal = formData[field] || ''
        if (oldVal !== newVal) {
          auditEvents.push({
            land_record_id: record.id,
            actor_id: actorId,
            field_name: field,
            old_value: String(oldVal),
            new_value: String(newVal),
            action: 'CORRECTION'
          })
        }
      }

      // Add APPROVE action
      auditEvents.push({
        land_record_id: record.id,
        actor_id: actorId,
        field_name: 'is_verified',
        old_value: 'false',
        new_value: 'true',
        action: 'APPROVE'
      })

      // Update land_records (Flattening the formData to save simple strings)
      const { error: recordError } = await supabase
        .from('land_records')
        .update({
          verified_data: formData,
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id)

      if (recordError) throw recordError

      // Insert audit events
      if (auditEvents.length > 0) {
        const { error: auditError } = await supabase.from('audit_events').insert(auditEvents)
        if (auditError) console.error('Failed to save audit events', auditError)
      }

      // Update documents
      const { error: docError } = await supabase
        .from('documents')
        .update({
          processing_status: 'VERIFIED'
        })
        .eq('id', documentId)

      if (docError) throw docError

      // Go back to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error verifying record:', error)
      alert('Failed to save verification.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this document and its extracted data?')) return;
    
    setDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const actorId = session?.user?.id

      if (record) {
        await supabase.from('audit_events').insert([{
          land_record_id: record.id,
          actor_id: actorId,
          field_name: 'document',
          action: 'DELETE'
        }])
        
        await supabase.from('land_records').update({ deleted_at: new Date().toISOString() }).eq('id', record.id)
      }

      const { error } = await supabase
        .from('documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', documentId)

      if (error) throw error

      router.push('/dashboard/documents')
    } catch (error) {
      console.error('Error deleting record:', error)
      alert('Failed to delete document.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-10 w-[200px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-[600px] w-full" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Document Not Found</h1>
        <Link href="/dashboard">
          <Button variant="outline">Return to Dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Verify Extraction</h1>
            <p className="text-muted-foreground text-sm">
              {document.filename} • {new Date(document.uploaded_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!record?.is_verified && (
             <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
               <Trash2 className="h-4 w-4 mr-2" />
               {deleting ? 'Deleting...' : 'Delete'}
             </Button>
          )}
          {record?.is_verified ? (
            <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-md font-medium border border-green-200">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Verified
            </div>
          ) : (
            <Button onClick={handleVerify} disabled={saving} className="bg-primary text-primary-foreground">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Confirm & Verify'}
            </Button>
          )}
        </div>
      </div>

      {record?.validation_flags && record.validation_flags.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-destructive text-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Validation Warnings Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-destructive/90">
              {record.validation_flags.map((flag: any, i: number) => (
                <li key={i}>
                  <strong>{flag.type}:</strong> {flag.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[600px]">
        {/* Original Document Preview */}
        <Card className="h-full flex flex-col overflow-hidden">
          <CardHeader className="py-4 border-b bg-muted/30">
            <CardTitle className="text-lg">Original Document</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 bg-muted/10 relative">
            {fileUrl ? (
              document.source_type?.includes('pdf') ? (
                <iframe src={fileUrl} className="w-full h-full border-0" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl} alt="Land Record" className="w-full h-full object-contain" />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Document preview not available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Extracted Data Form */}
        <Card className="h-full flex flex-col overflow-hidden">
          <CardHeader className="py-4 border-b bg-muted/30 flex-row items-center justify-between">
            <CardTitle className="text-lg">Extracted Data</CardTitle>
            {record?.confidence_score !== undefined && (
              <span className="text-sm font-medium px-2 py-1 bg-primary/10 text-primary rounded-md">
                Overall Confidence: {(record.confidence_score * 100).toFixed(0)}%
              </span>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6">
            {!record ? (
              <div className="text-center text-muted-foreground py-10">
                Data extraction is still in progress...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(fieldLabels).map((key) => {
                  const confidence = record?.extracted_data?.[key]?.confidence
                  const rawValue = record?.extracted_data?.[key]?.raw_value
                  let borderColor = ""
                  if (!record?.is_verified && confidence !== undefined) {
                    if (confidence > 0.85) borderColor = "border-green-500 focus-visible:ring-green-500"
                    else if (confidence >= 0.60) borderColor = "border-yellow-500 focus-visible:ring-yellow-500"
                    else borderColor = "border-red-500 focus-visible:ring-red-500"
                  }

                  return (
                    <div key={key} className="space-y-1.5">
                      <Label htmlFor={key} className="flex justify-between items-center text-xs font-medium">
                        {fieldLabels[key]}
                        {!record?.is_verified && confidence !== undefined && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-sm bg-background border ${
                            confidence > 0.85 ? 'text-green-600 border-green-200' : 
                            confidence >= 0.60 ? 'text-yellow-600 border-yellow-200' : 
                            'text-red-600 border-red-200'
                          }`}>
                            {(confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </Label>
                      <Input
                        id={key}
                        value={formData[key] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                        disabled={record?.is_verified}
                        className={borderColor}
                        placeholder={`Enter ${fieldLabels[key].toLowerCase()}`}
                      />
                      {rawValue && (
                        <p className="text-[11px] text-muted-foreground font-mono bg-muted/20 px-2 py-1 rounded-sm border border-dashed">
                          <span className="font-semibold opacity-70">Original:</span> {rawValue}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Raw OCR Layer Display */}
      {record?.extracted_data?.raw_text_layer && (
        <Card className="mt-8 border-indigo-100 dark:border-indigo-900/50">
          <CardHeader className="py-4 border-b bg-indigo-50/50 dark:bg-indigo-950/20">
            <CardTitle className="text-lg flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-500" />
              Raw OCR / Text Layer
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-muted/10">
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-mono bg-background p-4 rounded-md border">
              {record.extracted_data.raw_text_layer}
            </pre>
            <p className="text-xs text-muted-foreground mt-4 italic">
              * In the MVP, this layer is generated via Gemini Multimodal. The final architecture will integrate PaddleOCR/Tesseract for offline and open-source text extraction.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
