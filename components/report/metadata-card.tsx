'use client'

import { ReportData } from '@/types/report'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MetadataCardProps {
  report: ReportData
}

export function MetadataCard({ report }: MetadataCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
  }

  const getFileExtension = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toUpperCase()
    return ext || 'FILE'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Document Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">File:</span>
            <p className="font-medium truncate" title={report.fileName}>
              {report.fileName}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Type:</span>
            <p className="font-medium">{getFileExtension(report.fileName)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Words:</span>
            <p className="font-medium">{report.wordCount.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Scanned:</span>
            <p className="font-medium text-xs">{formatDate(report.scannedAt)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}