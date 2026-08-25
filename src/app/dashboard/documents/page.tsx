'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2 } from 'lucide-react'

type Document = {
  id: string
  filename: string
  source_type: string
  processing_status: string
  uploaded_at: string
}

export default function DocumentsList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDocuments() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .is('deleted_at', null)
          .order('uploaded_at', { ascending: false })

        if (error) throw error
        setDocuments(data || [])
      } catch (err) {
        console.error('Failed to fetch documents:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
    
    // Simple realtime polling for Hackathon MVP
    const interval = setInterval(fetchDocuments, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this document?')) return;
    
    try {
      const { error } = await supabase
        .from('documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      setDocuments(documents.filter(doc => doc.id !== id))
    } catch (err) {
      console.error('Failed to delete document:', err)
      alert('Failed to delete document')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge className="bg-green-500">Verified</Badge>
      case 'REVIEW_REQUIRED':
        return <Badge variant="destructive">Needs Review</Badge>
      case 'PROCESSING':
      case 'EXTRACTING':
        return <Badge variant="secondary">Processing</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
        <p className="text-muted-foreground mt-2">
          View all uploaded documents and their current processing status.
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Filename</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-[80px] ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No documents found.
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.filename}</TableCell>
                  <TableCell>{new Date(doc.uploaded_at).toLocaleDateString()}</TableCell>
                  <TableCell>{doc.source_type}</TableCell>
                  <TableCell>{getStatusBadge(doc.processing_status)}</TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2">
                    {doc.processing_status === 'REVIEW_REQUIRED' ? (
                      <Link href={`/verification/${doc.id}`}>
                        <Button size="sm">Verify</Button>
                      </Link>
                    ) : (
                      <Link href={`/documents/${doc.id}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                    )}
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(doc.id)}
                      title="Delete Document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
