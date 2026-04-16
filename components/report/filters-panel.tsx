'use client'

import { ScanFilters } from '@/types/report'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FiltersPanelProps {
  filters: ScanFilters
}

export function FiltersPanel({ filters }: FiltersPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Scan Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ignore references:</span>
            <span className="font-medium">{filters.ignoreReferences ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ignore quotes:</span>
            <span className="font-medium">{filters.ignoreQuotes ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Min match length:</span>
            <span className="font-medium">{filters.minCopiedWords} words</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}