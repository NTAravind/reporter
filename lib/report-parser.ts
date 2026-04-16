import { ReportData, Source, TextMatch } from '@/types/report'
import { SCORE_THRESHOLDS } from './constants'

interface CopyleaksWebhookPayload {
  scanId: string
  created: string
  status: string
  results?: {
    identical?: number
    similar?: number
    related?: number
    sources?: Record<
      string,
      {
        title?: string
        url?: string
        type?: string
        identical?: number
        similar?: number
        percent?: number
        isCited?: boolean
      }
    >
    text?: {
      totalWords?: number
      baseText?: string
    }
  }
  completed?: string
}

export function parseWebhookPayload(payload: CopyleaksWebhookPayload): ReportData {
  const { scanId, created, results, completed } = payload

  const text = results?.text?.baseText || ''
  const wordCount = results?.text?.totalWords || 0

  const identical = results?.identical || 0
  const similar = results?.similar || 0
  const related = results?.related || 0

  let citedScore = 0
  let uncitedScore = 0
  const sources: Source[] = []
  const matches: TextMatch[] = []

  if (results?.sources) {
    for (const [sourceId, sourceData] of Object.entries(results.sources)) {
      const source: Source = {
        id: sourceId,
        name: sourceData.title || `Source ${sourceId.slice(0, 8)}`,
        url: sourceData.url,
        type: mapSourceType(sourceData.type),
        contributionPercent: sourceData.percent || 0,
        isCited: sourceData.isCited || false,
      }
      sources.push(source)

      if (source.isCited) {
        citedScore += sourceData.percent || 0
      } else {
        uncitedScore += sourceData.percent || 0
      }
    }
  }

  const overallScore = identical + similar + related

  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  if (overallScore > SCORE_THRESHOLDS.MEDIUM) {
    riskLevel = 'high'
  } else if (overallScore > SCORE_THRESHOLDS.LOW) {
    riskLevel = 'medium'
  }

  const suggestions = generateSuggestions(sources, uncitedScore)

  return {
    scanId,
    scannedAt: completed || created,
    fileName: '',
    wordCount,
    overallScore,
    citedScore: Math.round(citedScore * 10) / 10,
    uncitedScore: Math.round(uncitedScore * 10) / 10,
    sources: sources.sort((a, b) => b.contributionPercent - a.contributionPercent),
    matches,
    riskLevel,
    suggestions,
    text,
  }
}

function mapSourceType(type?: string): 'web' | 'journal' | 'database' {
  if (!type) return 'web'
  const lower = type.toLowerCase()
  if (lower.includes('journal') || lower.includes('academic')) return 'journal'
  if (lower.includes('database') || lower.includes('repository')) return 'database'
  return 'web'
}

function generateSuggestions(sources: Source[], uncitedScore: number): string[] {
  const suggestions: string[] = []

  if (uncitedScore > 10) {
    suggestions.push('Consider citing sources for uncited similarity')
  }

  const uncitedSources = sources.filter((s) => !s.isCited && s.contributionPercent > 5)
  for (const source of uncitedSources.slice(0, 3)) {
    suggestions.push(`Section matches "${source.name}" — consider adding a citation`)
  }

  return suggestions
}

export function createMockReport(scanId: string, fileName: string): ReportData {
  const now = new Date().toISOString()
  return {
    scanId,
    scannedAt: now,
    fileName,
    wordCount: 1250,
    overallScore: 28,
    citedScore: 8,
    uncitedScore: 20,
    sources: [
      {
        id: 'src1',
        name: 'Wikipedia - Artificial Intelligence',
        url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
        type: 'web',
        contributionPercent: 15,
        isCited: false,
      },
      {
        id: 'src2',
        name: 'Journal of Machine Learning',
        url: 'https://jmlr.org/papers/v21/20-1234.html',
        type: 'journal',
        contributionPercent: 8,
        isCited: true,
      },
      {
        id: 'src3',
        name: 'GitHub Repository',
        url: 'https://github.com/example/ml-repo',
        type: 'web',
        contributionPercent: 5,
        isCited: false,
      },
    ],
    matches: [
      { start: 120, end: 180, sourceId: 'src1', matchType: 'exact' },
      { start: 450, end: 520, sourceId: 'src2', matchType: 'paraphrased' },
      { start: 890, end: 950, sourceId: 'src3', matchType: 'exact' },
    ],
    riskLevel: 'medium',
    suggestions: [
      'Consider citing the Wikipedia source or paraphrasing to avoid similarity',
      'Section 2 has 15% uncited similarity from the ML journal',
    ],
    text: `Artificial Intelligence (AI) is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans and other animals. Computer science defines AI research as the study of "intelligent agents": any device that perceives its environment and takes actions that maximize its chance of successfully achieving its goals.

Machine learning (ML) is a field of inquiry devoted to understanding and building methods that 'learn', that is, methods that leverage data to improve performance on some set of tasks. It is seen as a part of artificial intelligence. Machine learning algorithms build a model based on sample data, known as training data, in order to make predictions or decisions without being explicitly programmed to do so.

Deep learning is part of a broader family of machine learning methods based on artificial neural networks with representation learning. Learning can be supervised, semi-supervised or unsupervised. Deep-learning architectures such as deep neural networks, deep belief networks, deep reinforcement learning, recurrent neural networks and convolutional neural networks have been applied to fields including computer vision, speech recognition, natural language processing, audio recognition, social network filtering, machine translation, bioinformatics, drug design, medical image analysis, material inspection and program checking.

Neural networks were inspired by information processing and distributed communication nodes in biological systems. The neocognitron introduced by Kunihiko Fukushima in 1980 introduced a hierarchy model with selective attention capabilities, capable of recognizing patterns with strong deformation and translation invariance. The vanishing gradient problem was addressed in 1991 with the development of the LSTM network by Sepp Hochreiter and Jürgen Schmidhuber. Backpropagation was developed in the 1970s but was not widely used until the 1990s. In 2006, the term "deep learning" was reintroduced by Geoffrey Hinton to describe new techniques for training multi-layer neural networks.

Recent advances in AI have been driven by the availability of large datasets and increased computing power. GPUs and TPUs have enabled training of larger and more complex models. The field has seen rapid progress in areas such as image classification, natural language processing, and game-playing. However, there are still many challenges to overcome, including interpretability, robustness, and ethical considerations.`,
  }
}