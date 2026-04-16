'use client'

import { ReportData } from '@/types/report'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface RiskBannerProps {
  report: ReportData
}

export function RiskBanner({ report }: RiskBannerProps) {
  const { riskLevel, suggestions } = report

  const getAlertVariant = (level: 'low' | 'medium' | 'high'): 'default' | 'destructive' => {
    switch (level) {
      case 'low':
        return 'default'
      case 'medium':
        return 'default'
      case 'high':
        return 'destructive'
    }
  }

  const getTitle = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'Low Similarity - Acceptable'
      case 'medium':
        return 'Medium Similarity - Review Recommended'
      case 'high':
        return 'High Similarity - Attention Required'
    }
  }

  const getDescription = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'Your paper is within acceptable similarity range.'
      case 'medium':
        return 'Some sections have similarity that should be reviewed. Consider adding citations where needed.'
      case 'high':
        return 'High similarity detected. We recommend revising to add proper citations and paraphrasing.'
    }
  }

  return (
    <Alert variant={getAlertVariant(riskLevel)}>
      <AlertTitle>{getTitle(riskLevel)}</AlertTitle>
      <AlertDescription>{getDescription(riskLevel)}</AlertDescription>
      {suggestions.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      )}
    </Alert>
  )
}