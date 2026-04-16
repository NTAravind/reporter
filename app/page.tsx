'use client'

import { useState, useEffect, useCallback } from 'react'
import { UploadZone } from '@/components/upload-zone'
import { ReportShell } from '@/components/report/report-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ScanFilters, ReportData } from '@/types/report'
import { POLL_INTERVAL_MS } from '@/lib/constants'

export default function Home() {
  const [scanId, setScanId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'polling' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [report, setReport] = useState<ReportData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pollReport = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/report/${id}`)
      const data = await res.json()
      
      if (data.status === 'done' && data.report) {
        setReport(data.report)
        setStatus('done')
        setProgress(100)
      } else {
        setProgress(prev => Math.min(prev + 10, 90))
      }
    } catch (err) {
      console.error('Polling error:', err)
    }
  }, [])

  useEffect(() => {
    if (status !== 'polling' || !scanId) return

    const interval = setInterval(() => {
      pollReport(scanId)
    }, POLL_INTERVAL_MS)

    pollReport(scanId)

    return () => clearInterval(interval)
  }, [status, scanId, pollReport])

  const handleSubmit = async (file: File, filters: ScanFilters) => {
    setError(null)
    setStatus('submitting')
    setProgress(10)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filters', JSON.stringify(filters))

      const res = await fetch('/api/copyleaks/submit', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Failed to submit file')
      }

      const data = await res.json()
      setScanId(data.scanId)
      setStatus('polling')
      setProgress(20)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setStatus('idle')
    }
  }

  const handleReset = () => {
    setScanId(null)
    setStatus('idle')
    setProgress(0)
    setReport(null)
    setError(null)
  }

  const isSubmitting = status === 'submitting' || status === 'polling'
  const isIdle = status === 'idle'

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-black dark:to-zinc-900">
      <div className="container max-w-4xl py-12 px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Plagiarism Checker</h1>
          <p className="text-muted-foreground text-lg">
            Upload your document to check for plagiarism
          </p>
        </div>

        {isIdle && (
          <UploadZone onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        )}

        {(status === 'submitting' || status === 'polling') && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">
                {status === 'submitting' ? 'Submitting your document...' : 'Scanning for plagiarism...'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground">
                {status === 'submitting' 
                  ? 'Uploading file...' 
                  : 'Analyzing document against billions of sources'}
              </p>
              <p className="text-center text-xs text-muted-foreground">
                This may take a minute or two
              </p>
            </CardContent>
          </Card>
        )}

        {status === 'done' && report && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Scan Results</h2>
              <Button variant="outline" onClick={handleReset}>
                Check Another File
              </Button>
            </div>
            <ReportShell report={report} />
          </div>
        )}

        {error && (
          <Card className="max-w-md mx-auto border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-center">{error}</p>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setStatus('idle')}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}