'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { UploadCloud, File, AlertCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

export default function UploadDocumentPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload')
      return
    }

    setUploading(true)
    setProgress(10)
    setError(null)

    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `uploads/${fileName}`

      setProgress(30)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('land-records')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      setProgress(70)

      // 2. Insert metadata into documents table
      const { data: { session } } = await supabase.auth.getSession()
      const uploaderId = session?.user?.id

      const { data: docData, error: dbError } = await supabase
        .from('documents')
        .insert([
          {
            filename: file.name,
            storage_path: filePath,
            source_type: file.type,
            processing_status: 'UPLOADED',
            uploaded_by: uploaderId
          }
        ])
        .select()
        .single()

      if (dbError) throw dbError

      setProgress(100)
      
      // 3. Redirect to processing page
      if (docData) {
        router.push(`/dashboard/documents/${docData.id}`)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred during upload. Are you sure you ran the Supabase SQL schema?')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Upload Land Record</CardTitle>
          <CardDescription>
            Upload a scanned PDF or image of a land record for AI extraction and digitization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-10 flex flex-col items-center justify-center text-center bg-muted/10 hover:bg-muted/20 transition-colors">
            <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
            <Label htmlFor="file-upload" className="cursor-pointer">
              <span className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium">
                Select File
              </span>
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </Label>
            <p className="text-sm text-muted-foreground mt-4">
              Supported formats: PDF, JPEG, PNG (Max 25MB)
            </p>
          </div>

          {file && (
            <div className="bg-muted/50 p-4 rounded-md flex items-center justify-between">
              <div className="flex items-center space-x-3 truncate">
                <File className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium truncate">{file.name}</span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center text-sm">
              <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
              {error}
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span>Uploading to Secure Storage...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Processing...' : 'Upload & Process'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
