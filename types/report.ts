export interface ReportData {
  scanId: string
  scannedAt: string
  fileName: string
  wordCount: number
  overallScore: number
  citedScore: number
  uncitedScore: number
  sources: Source[]
  matches: TextMatch[]
  riskLevel: 'low' | 'medium' | 'high'
  suggestions: string[]
  text: string
}

export interface Source {
  id: string
  name: string
  url?: string
  type: 'web' | 'journal' | 'database'
  contributionPercent: number
  isCited: boolean
}

export interface TextMatch {
  start: number
  end: number
  sourceId: string
  matchType: 'exact' | 'paraphrased'
}

export interface ScanFilters {
  ignoreReferences: boolean
  ignoreQuotes: boolean
  minCopiedWords: number
}

export interface SubmitResponse {
  scanId: string
}

export interface PollResponse {
  status: 'pending' | 'done'
  report?: ReportData
}