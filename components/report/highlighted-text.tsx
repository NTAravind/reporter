'use client'

import { useMemo } from 'react'
import { ReportData, TextMatch } from '@/types/report'
import { SOURCE_COLORS } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface HighlightedTextProps {
  report: ReportData
}

export function HighlightedText({ report }: HighlightedTextProps) {
  const { text, matches, sources } = report

  const sourceColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    sources.forEach((source, index) => {
      map[source.id] = SOURCE_COLORS[index % SOURCE_COLORS.length]
    })
    return map
  }, [sources])

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => a.start - b.start)
  }, [matches])

  const renderHighlightedText = () => {
    if (matches.length === 0) {
      return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
    }

    const elements: React.ReactNode[] = []
    let lastIndex = 0

    sortedMatches.forEach((match, idx) => {
      if (match.start > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>
            {text.slice(lastIndex, match.start)}
          </span>
        )
      }

      const color = sourceColorMap[match.sourceId] || '#888'
      const isExact = match.matchType === 'exact'
      
      elements.push(
        <mark
          key={`match-${idx}`}
          className={`relative px-0.5 rounded ${
            isExact ? '' : 'bg-yellow-200'
          }`}
          style={{
            backgroundColor: isExact ? `${color}40` : undefined,
            borderBottom: isExact ? `2px solid ${color}` : '2px dashed #f59e0b',
          }}
          title={`Source: ${sources.find(s => s.id === match.sourceId)?.name || 'Unknown'}`}
        >
          {text.slice(match.start, match.end)}
        </mark>
      )

      lastIndex = match.end
    })

    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end">{text.slice(lastIndex)}</span>
      )
    }

    return <p className="whitespace-pre-wrap leading-relaxed">{elements}</p>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Highlighted Text</CardTitle>
        <div className="flex flex-wrap gap-3 pt-2">
          {sources.map((source, index) => (
            <div key={source.id} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: sourceColorMap[source.id] }}
              />
              <span className="text-sm text-muted-foreground">
                {source.name.length > 30
                  ? source.name.slice(0, 30) + '...'
                  : source.name}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded border-2 border-dashed border-yellow-500" />
            <span className="text-sm text-muted-foreground">Paraphrased</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto p-4 bg-muted/30 rounded-lg">
          {renderHighlightedText()}
        </div>
      </CardContent>
    </Card>
  )
}