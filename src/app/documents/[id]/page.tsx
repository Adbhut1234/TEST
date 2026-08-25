'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, BrainCircuit, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DocumentProcessingPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string

  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE')
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!documentId) return
    if (hasFetched.current) return
    hasFetched.current = true

    const processDocument = async () => {
      setStatus('PROCESSING')
      setError(null)

      try {
        const res = await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId })
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to process document')
        }

        setStatus('SUCCESS')

        // Short delay to show success state before redirecting
        setTimeout(() => {
          router.push(`/verification/${documentId}`)
        }, 1500)

      } catch (err: any) {
        setStatus('ERROR')
        setError(err.message)
      }
    }

    processDocument()
  }, [documentId, router])

  return (
    <div className="container mx-auto py-20 max-w-xl text-center">
      <Card>
        <CardHeader>
          <CardTitle>AI Processing</CardTitle>
          <CardDescription>
            Gemini 1.5 Flash is analyzing the document layout and extracting fields...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 py-8">
          {status === 'PROCESSING' && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <BrainCircuit className="h-16 w-16 text-primary animate-pulse" />
              <p className="text-sm font-medium animate-pulse">Running Multimodal AI Extraction...</p>
              <Progress className="w-[60%] h-2" value={null} />
            </div>
          )}

          {status === 'SUCCESS' && (
            <div className="flex flex-col items-center justify-center space-y-4 text-green-600">
              <CheckCircle2 className="h-16 w-16" />
              <p className="text-sm font-medium">Extraction Complete! Redirecting to Verification...</p>
            </div>
          )}

          {status === 'ERROR' && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="bg-destructive/10 text-destructive p-4 rounded-full">
                <AlertCircle className="h-12 w-12" />
              </div>
              <p className="text-destructive font-medium">Extraction Failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                Retry Processing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
