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
import { Download } from 'lucide-react'

type LandRecord = {
  id: string
  document_id: string
  verified_data: any
  confidence_score: number
  updated_at: string
}

export default function VerifiedRecordsList() {
  const [records, setRecords] = useState<LandRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecords() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('land_records')
          .select('*')
          .eq('is_verified', true)
          .order('updated_at', { ascending: false })

        if (error) throw error
        setRecords(data || [])
      } catch (err) {
        console.error('Failed to fetch land records:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRecords()
    
    // Simple realtime polling for Hackathon MVP
    const interval = setInterval(fetchRecords, 3000)
    return () => clearInterval(interval)
  }, [])

  const exportToCSV = () => {
    if (records.length === 0) return

    const headers = ['Document ID', 'Owner Name', 'Khasra Number', 'Land Area', 'Village', 'Verified At']
    const csvRows = [headers.join(',')]

    records.forEach(record => {
      const row = [
        record.document_id,
        `"${record.verified_data?.owner_name || ''}"`,
        `"${record.verified_data?.khasra_number || ''}"`,
        `"${record.verified_data?.land_area || ''}"`,
        `"${record.verified_data?.village || ''}"`,
        new Date(record.updated_at).toLocaleDateString()
      ]
      csvRows.push(row.join(','))
    })

    const csvString = csvRows.join('\n')
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.setAttribute('hidden', '')
    a.setAttribute('href', url)
    a.setAttribute('download', `verified_land_records_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Verified Records</h2>
          <p className="text-muted-foreground mt-2">
            View all land records that have been fully digitized and verified by an officer.
          </p>
        </div>
        <Button variant="outline" onClick={exportToCSV} disabled={loading || records.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Record ID</TableHead>
              <TableHead>Verification Date</TableHead>
              <TableHead>Confidence Score</TableHead>
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
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No verified records found.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium truncate max-w-[200px]">{record.id}</TableCell>
                  <TableCell>{new Date(record.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {record.confidence_score 
                      ? `${(record.confidence_score * 100).toFixed(0)}%` 
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-500">Verified</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/verification/${record.document_id}`}>
                      <Button size="sm" variant="outline">View Data</Button>
                    </Link>
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
