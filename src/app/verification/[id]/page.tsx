'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle2, Save, Trash2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

export default function VerificationPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string

  const [document, setDocument] = useState<any>(null)
  const [record, setRecord] = useState<any>(null)
  const [formData, setFormData] = useState<any>({
    owner_name: '',
    khasra_number: '',
    land_area: '',
    village: ''
  })
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

        // Fetch file URL
        const { data: fileData } = supabase.storage
          .from('land-records')
          .getPublicUrl(docData.storage_path)
        setFileUrl(fileData.publicUrl)

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
          const dataToUse = recordData.verified_data || recordData.extracted_data || {}
          setFormData({
            owner_name: dataToUse.owner_name || '',
            khasra_number: dataToUse.khasra_number || '',
            land_area: dataToUse.land_area || '',
            village: dataToUse.village || ''
          })
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
      const oldData = record.verified_data || record.extracted_data || {}
      
      // Check each field for corrections
      const fields = ['owner_name', 'khasra_number', 'land_area', 'village']
      for (const field of fields) {
        if (oldData[field] !== formData[field]) {
          auditEvents.push({
            land_record_id: record.id,
            actor_id: actorId,
            field_name: field,
            old_value: oldData[field] || '',
            new_value: formData[field] || '',
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

      // Update land_records
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
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <p className="text-muted-foreground animate-pulse">Loading document data...</p>
        </div>
      </div>
    )
  }

  if (!document || !record) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-destructive font-semibold">Document or Record not found.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-muted/20">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b bg-background">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/documents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-lg">Officer Verification</h1>
            <p className="text-sm text-muted-foreground">ID: {documentId}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/dashboard/documents')}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting || saving}>
            {deleting ? 'Deleting...' : (
              <>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </>
            )}
          </Button>
          <Button onClick={handleVerify} disabled={saving || deleting} className="bg-green-600 hover:bg-green-700">
            {saving ? 'Saving...' : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve & Verify
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Split Pane */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Document Viewer */}
        <section className="w-1/2 h-full border-r bg-zinc-100 dark:bg-zinc-900 p-4 relative">
          {fileUrl ? (
            <div className="w-full h-full rounded-md overflow-hidden border bg-white shadow-sm">
              {document.source_type?.includes('pdf') ? (
                <iframe src={`${fileUrl}#toolbar=0`} className="w-full h-full" title="Document Viewer" />
              ) : document.source_type?.includes('image') ? (
                <img src={fileUrl} alt="Document" className="w-full h-full object-contain" />
              ) : (
                <iframe src={fileUrl} className="w-full h-full" title="Document Viewer" />
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No preview available
            </div>
          )}
        </section>

        {/* Right Side: Extraction Form */}
        <section className="w-1/2 h-full overflow-y-auto p-8 bg-background">
          <Card className="shadow-none border-none">
            <CardHeader className="px-0">
              <CardTitle className="text-2xl">Extracted Data</CardTitle>
              <p className="text-muted-foreground">
                Please review the AI-extracted information against the original document on the left. Correct any mistakes before verifying.
              </p>
            </CardHeader>
            <CardContent className="px-0 space-y-6 mt-4">
              
              {/* Fraud Detection Banners */}
              {record.validation_flags && record.validation_flags.length > 0 && (
                <div className="space-y-3 mb-6">
                  {record.validation_flags.map((flag: any, index: number) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-md border flex items-start gap-3 ${
                        flag.type === 'CRITICAL' 
                          ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/50 dark:border-red-900 dark:text-red-200' 
                          : 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950/50 dark:border-yellow-900 dark:text-yellow-200'
                      }`}
                    >
                      <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm">
                          {flag.type === 'CRITICAL' ? 'Critical Alert' : 'System Warning'}
                        </h4>
                        <p className="text-sm mt-1">{flag.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-3">
                <Label htmlFor="owner_name" className="text-base font-semibold">Owner Name</Label>
                <Input 
                  id="owner_name"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                  className="h-12 bg-muted/50"
                  placeholder="e.g. Rajesh Kumar Sharma"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="khasra_number" className="text-base font-semibold">Khasra Number</Label>
                <Input 
                  id="khasra_number"
                  value={formData.khasra_number}
                  onChange={(e) => setFormData({...formData, khasra_number: e.target.value})}
                  className="h-12 bg-muted/50"
                  placeholder="e.g. 452/1"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="land_area" className="text-base font-semibold">Land Area</Label>
                <Input 
                  id="land_area"
                  value={formData.land_area}
                  onChange={(e) => setFormData({...formData, land_area: e.target.value})}
                  className="h-12 bg-muted/50"
                  placeholder="e.g. 1.5 Hectares"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="village" className="text-base font-semibold">Village / Location</Label>
                <Input 
                  id="village"
                  value={formData.village}
                  onChange={(e) => setFormData({...formData, village: e.target.value})}
                  className="h-12 bg-muted/50"
                  placeholder="e.g. Rampur"
                />
              </div>

            </CardContent>
          </Card>
        </section>
        
      </main>
    </div>
  )
}
