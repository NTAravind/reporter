'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CitationSectionProps {
  citedScore: number
  uncitedScore: number
}

export function CitationSection({ citedScore, uncitedScore }: CitationSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">
            Cited Similarity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-700">
            {citedScore.toFixed(1)}%
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Properly cited matches
          </p>
        </CardContent>
      </Card>
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-red-700">
            Uncited Similarity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-700">
            {uncitedScore.toFixed(1)}%
          </div>
          <p className="text-xs text-red-600 mt-1">
            Requires attention
          </p>
        </CardContent>
      </Card>
    </div>
  )
}