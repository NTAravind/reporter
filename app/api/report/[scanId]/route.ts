import { NextRequest, NextResponse } from 'next/server'
import { getReport } from '@/lib/store'

interface RouteParams {
  params: Promise<{ scanId: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { scanId } = await params

  const report = getReport(scanId)

  if (report) {
    return NextResponse.json({ status: 'done', report })
  }

  return NextResponse.json({ status: 'pending' })
}