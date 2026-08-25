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

  const [districtData, setDistrictData] = useState<any[]>([])
  const [errorData, setErrorData] = useState<any[]>([])

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

        // Dynamic Aggregation for Districts and Errors
        const { data: recordsData } = await supabase.from('land_records').select('extracted_data, verified_data, is_verified')
        
        const dCount: Record<string, number> = {}
        const errCount: Record<string, { total: number, lowConf: number }> = {}

        if (recordsData) {
          recordsData.forEach(r => {
            // Aggregate Districts
            const district = r.is_verified ? r.verified_data?.district : r.extracted_data?.district?.value
            if (district && district !== 'null') {
              dCount[district] = (dCount[district] || 0) + 1
            }

            // Aggregate Error Rates (< 85% confidence)
            if (!r.is_verified && r.extracted_data) {
               Object.keys(r.extracted_data).forEach(field => {
                 if (field === 'raw_text_layer') return
                 const conf = r.extracted_data[field]?.confidence
                 if (conf !== undefined) {
                   if (!errCount[field]) errCount[field] = { total: 0, lowConf: 0 }
                   errCount[field].total += 1
                   if (conf < 0.85) errCount[field].lowConf += 1
                 }
               })
            }
          })
        }

        const sortedDistricts = Object.keys(dCount)
          .map(k => ({ name: k.substring(0,10), records: dCount[k] }))
          .sort((a,b) => b.records - a.records)
          .slice(0, 5)

        const sortedErrors = Object.keys(errCount)
          .map(k => ({ 
             name: k.replace(/_/g, ' ').substring(0,8), 
             rate: Math.round((errCount[k].lowConf / errCount[k].total) * 100) 
          }))
          .sort((a,b) => b.rate - a.rate)
          .slice(0, 5)

        setDistrictData(sortedDistricts)
        setErrorData(sortedErrors)

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
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div className="relative overflow-hidden rounded-3xl p-8 lg:p-10 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-primary/10 border border-white/20 dark:border-white/5 shadow-sm">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-primary/20 rounded-full blur-3xl mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl mix-blend-multiply" />
        <div className="relative z-10">
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-900 dark:from-white dark:via-indigo-200 dark:to-white">
            Dashboard Overview
          </h2>
          <p className="text-muted-foreground mt-4 text-lg lg:text-xl max-w-2xl leading-relaxed">
            Monitor your land record digitization pipeline, track verification progress, and analyze regional data in real-time.
          </p>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden border border-border/50 bg-background/50 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Documents</CardTitle>
            <div className="p-2 bg-indigo-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <FileText className="h-5 w-5 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            {loading ? (
              <Skeleton className="h-10 w-[100px]" />
            ) : (
              <div className="text-4xl font-black tracking-tighter">{stats.total}</div>
            )}
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border border-border/50 bg-background/50 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Verified Records</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            {loading ? (
              <Skeleton className="h-10 w-[100px]" />
            ) : (
              <div className="text-4xl font-black tracking-tighter text-emerald-600 dark:text-emerald-400">{stats.verified}</div>
            )}
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border border-border/50 bg-background/50 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Review Required</CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            {loading ? (
              <Skeleton className="h-10 w-[100px]" />
            ) : (
              <div className="text-4xl font-black tracking-tighter text-amber-600 dark:text-amber-400">{stats.reviewRequired}</div>
            )}
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border border-border/50 bg-background/50 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Failed Extractions</CardTitle>
            <div className="p-2 bg-rose-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            {loading ? (
              <Skeleton className="h-10 w-[100px]" />
            ) : (
              <div className="text-4xl font-black tracking-tighter text-rose-600 dark:text-rose-400">{stats.failed}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Pie Chart */}
        <Card className="col-span-1 border border-border/50 bg-background/50 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-border/10">
            <CardTitle className="text-lg font-bold">Pipeline Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] pt-6">
            {loading ? (
              <Skeleton className="w-full h-full rounded-full" />
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground font-medium">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* District Progress Bar Chart */}
        <Card className="col-span-1 lg:col-span-1 border border-border/50 bg-background/50 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-border/10">
            <CardTitle className="text-lg font-bold">District Progress</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] pt-6">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} fontWeight={500} />
                  <RechartsTooltip 
                    cursor={{fill: 'var(--muted)'}} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="records" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Field Error Rate Bar Chart */}
        <Card className="col-span-1 lg:col-span-1 border border-border/50 bg-background/50 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-border/10">
            <CardTitle className="text-lg font-bold">Field Error Rate (%)</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] pt-6">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    cursor={{fill: 'var(--muted)'}} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="rate" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
