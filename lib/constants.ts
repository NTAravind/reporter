export const SCORE_THRESHOLDS = {
  LOW: 15,
  MEDIUM: 30,
} as const

export const RISK_COLORS = {
  low: 'text-green-600 bg-green-50 border-green-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  high: 'text-red-600 bg-red-50 border-red-200',
} as const

export const SOURCE_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#14b8a6',
  '#eab308',
  '#6366f1',
  '#84cc16',
]

export const MATCH_TYPE_COLORS = {
  exact: 'bg-red-200',
  paraphrased: 'bg-yellow-200',
} as const

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim().replace(/\/$/, '')
export const API_BASE_URL = baseUrl

export const POLL_INTERVAL_MS = 5000

export const DEFAULT_FILTERS = {
  ignoreReferences: false,
  ignoreQuotes: false,
  minCopiedWords: 5,
}