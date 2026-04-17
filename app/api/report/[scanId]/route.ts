import { NextRequest, NextResponse } from 'next/server'
import { getReport, storeReport } from '@/lib/store'
import { getCopyleaksToken } from '@/lib/copyleaks'
import { parseWebhookPayload } from '@/lib/report-parser'

interface RouteParams {
  params: Promise<{ scanId: string }>
}

const COPYLEAKS_EXPORT_URL = 'https://api.copyleaks.com/v3/downloads'

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { scanId } = await params

  const report = getReport(scanId)

  if (report) {
    return NextResponse.json({ status: 'done', report })
  }

  try {
    const token = await getCopyleaksToken()
    const res = await fetch(`${COPYLEAKS_EXPORT_URL}/${scanId}/report`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (res.status === 200) {
      const data = await res.json()
      const parsedReport = parseWebhookPayload({ ...data, scanId })
      storeReport(scanId, parsedReport)
      return NextResponse.json({ status: 'done', report: parsedReport })
    }

    if (res.status === 404 || res.status === 423) {
      return NextResponse.json({ status: 'pending' })
    }
  } catch (err) {
    console.error('Copyleaks API error:', err)
  }

  return NextResponse.json({ status: 'pending' })
}