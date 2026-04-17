import { NextRequest, NextResponse } from 'next/server'
import { parseWebhookPayload } from '@/lib/report-parser'
import { storeReport } from '@/lib/store'

interface RouteParams {
  params: Promise<{ status: string; scanId: string }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { status, scanId } = await params
    console.log('[Webhook] Received hit from Copyleaks:', { status, scanId })

    if (status === '2') {
      const payload = await req.json()
      const report = parseWebhookPayload({ ...payload, scanId })
      storeReport(scanId, report)
      console.log('[Webhook] Scan completed. Report stored.')
    } else if (status === '4') {
      const payload = await req.json()
      console.error('[Webhook] Scan failed:', payload)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}