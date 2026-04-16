import { NextRequest, NextResponse } from 'next/server'
import { getReport, storeReport } from '@/lib/store'
import { getCopyleaksToken } from '@/lib/copyleaks'
import { parseWebhookPayload } from '@/lib/report-parser'

interface RouteParams {
  params: Promise<{ scanId: string }>
}

const COPYLEAKS_RESULT_URL = 'https://api.copyleaks.com/v3/businesses'

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { scanId } = await params
  const url = new URL(req.url)
  const attempt = parseInt(url.searchParams.get('attempt') || '0', 10)

  const report = getReport(scanId)

  if (report) {
    return NextResponse.json({ status: 'done', report })
  }

  if (attempt >= 3) {
    try {
      const token = await getCopyleaksToken()
      const res = await fetch(`${COPYLEAKS_RESULT_URL}/${scanId}/result`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        const parsedReport = parseWebhookPayload({ ...data, scanId })
        storeReport(scanId, parsedReport)
        return NextResponse.json({ status: 'done', report: parsedReport })
      }
    } catch (err) {
      console.error('Copyleaks API fallback error:', err)
    }
  }

  return NextResponse.json({ status: 'pending' })
}