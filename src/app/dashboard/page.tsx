'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts'

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444']

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    reviewRequired: 0,
    failed: 0,
  })
  
  const [pieData, setPieData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data for District Progress and Error Rates (as requested for MVP)
  const districtData = [
    { name: 'Lucknow', records: 40 },
    { name: 'Patna', records: 25 },
    { name: 'Bhopal', records: 18 },
    { name: 'Raipur', records: 12 },
  ]

  const errorData = [
    { name: 'Owner', rate: 12 },
    { name: 'Khasra', rate: 8 },
    { name: 'Area', rate: 15 },
    { name: 'Tehsil', rate: 20 },
  ]

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      try {
        // Soft delete fix: `.is('deleted_at', null)`
        const { data, error } = await supabase
          .from('documents')
          .select('processing_status')
          .is('deleted_at', null)

        if (error) throw error

        const total = data.length
        const verified = data.filter((d) => d.processing_status === 'VERIFIED').length
        const reviewRequired = data.filter((d) => d.processing_status === 'REVIEW_REQUIRED').length
        const extracting = data.filter((d) => d.processing_status === 'EXTRACTING').length
        const failed = data.filter((d) => d.processing_status === 'FAILED').length

        setStats({ total, verified, reviewRequired, failed })
        
        setPieData([
          { name: 'Verified', value: verified },
          { name: 'Review Req', value: reviewRequired },
          { name: 'Extracting', value: extracting },
          { name: 'Failed', value: failed }
        ].filter(d => d.value > 0))

      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-2">
          Monitor your land record digitization pipeline and regional progress.
        </p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Records</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Review Required</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold text-amber-500">{stats.reviewRequired}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Extractions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Pie Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Pipeline Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <Skeleton className="w-full h-full rounded-full" />
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* District Progress Bar Chart */}
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">District Progress</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="records" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Field Error Rate Bar Chart */}
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Field Extraction Error Rate (%)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="rate" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
