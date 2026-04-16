'use client'

import { useState } from 'react'
import { ReportData } from '@/types/report'
import { ScoreBadge } from './score-badge'
import { SourcesTable } from './sources-table'
import { HighlightedText } from './highlighted-text'
import { SourceBreakdown } from './source-breakdown'
import { MatchTypeLegend } from './match-type-legend'
import { CitationSection } from './citation-section'
import { FiltersPanel } from './filters-panel'
import { MetadataCard } from './metadata-card'
import { RiskBanner } from './risk-banner'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface ReportShellProps {
  report: ReportData
}

export function ReportShell({ report }: ReportShellProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const res = await fetch(`/api/report/${report.scanId}/pdf`)
      if (!res.ok) throw new Error('Failed to generate PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `plagiarism-report-${report.scanId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div></div>
        <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
          <Download className="mr-2 h-4 w-4" />
          {isDownloading ? 'Generating...' : 'Download PDF Report'}
        </Button>
      </div>
      
      <RiskBanner report={report} />
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <ScoreBadge score={report.overallScore} />
        </div>
        <div className="md:col-span-2">
          <CitationSection 
            citedScore={report.citedScore} 
            uncitedScore={report.uncitedScore} 
          />
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="text">Full Text</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <MetadataCard report={report} />
            <FiltersPanel filters={{
              ignoreReferences: false,
              ignoreQuotes: false,
              minCopiedWords: 5
            }} />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <SourcesTable sources={report.sources.slice(0, 5)} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sources" className="space-y-6">
          <SourcesTable sources={report.sources} />
          <Card>
            <CardHeader>
              <CardTitle>Source Details</CardTitle>
            </CardHeader>
            <CardContent>
              <SourceBreakdown sources={report.sources} />
            </CardContent>
          </Card>
          <MatchTypeLegend />
        </TabsContent>
        
        <TabsContent value="text">
          <HighlightedText report={report} />
        </TabsContent>
      </Tabs>
    </div>
  )
}