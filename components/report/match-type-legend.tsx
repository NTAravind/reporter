'use client'

import { Card, CardContent } from '@/components/ui/card'

export function MatchTypeLegend() {
  return (
    <Card>
      <CardContent className="pt-4">
        <h4 className="font-medium mb-3">Match Types</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded bg-red-300" />
            <span className="text-sm">Exact match</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded border-2 border-dashed border-yellow-500" />
            <span className="text-sm">Paraphrased</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}