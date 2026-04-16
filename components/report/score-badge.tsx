'use client'

import { SCORE_THRESHOLDS } from '@/lib/constants'

interface ScoreBadgeProps {
  score: number
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  const getRiskLevel = (score: number): 'low' | 'medium' | 'high' => {
    if (score > SCORE_THRESHOLDS.MEDIUM) return 'high'
    if (score > SCORE_THRESHOLDS.LOW) return 'medium'
    return 'low'
  }

  const risk = getRiskLevel(score)
  
  const getColors = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
    }
  }

  const colors = getColors(risk)

  const circumference = 2 * Math.PI * 45
  const progress = (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className={`transition-all duration-1000 ${
              risk === 'low' ? 'text-green-500' :
              risk === 'medium' ? 'text-amber-500' : 'text-red-500'
            }`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-3xl font-bold ${colors.split(' ')[0]}`}>
            {Math.round(score)}%
          </span>
        </div>
      </div>
      <div className={`px-4 py-2 rounded-full border ${colors}`}>
        <span className="font-medium capitalize">{risk} risk</span>
      </div>
    </div>
  )
}