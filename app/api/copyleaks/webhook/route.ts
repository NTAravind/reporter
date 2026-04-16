import { NextRequest, NextResponse } from 'next/server'
import { parseWebhookPayload } from '@/lib/report-parser'
import { storeReport } from '@/lib/store'
import { createMockReport } from '@/lib/report-parser'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const { scanId, status } = payload

    if (!scanId) {
      return NextResponse.json({ error: 'No scanId provided' }, { status: 400 })
    }

    if (status === 'completed' || status === 'success') {
      const report = parseWebhookPayload(payload)
      storeReport(scanId, report)
    } else if (status === 'pending' || status === 'processing') {
      console.log(`Scan ${scanId} is ${status}`)
    } else if (status === 'failed' || status === 'error') {
      console.error(`Scan ${scanId} failed:`, payload)
      const mockReport = createMockReport(scanId, 'document.pdf')
      storeReport(scanId, mockReport)
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