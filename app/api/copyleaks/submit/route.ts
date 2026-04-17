import { NextRequest, NextResponse } from 'next/server'
import { getCopyleaksToken, submitScan, fileToBase64 } from '@/lib/copyleaks'
import { API_BASE_URL } from '@/lib/constants'
import { ScanFilters } from '@/types/report'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const filtersJson = formData.get('filters') as string | null
    const filters: ScanFilters = filtersJson ? JSON.parse(filtersJson) : {}
    
    const ignoreReferences = filters.ignoreReferences ?? false
    const ignoreQuotes = filters.ignoreQuotes ?? false
    const minCopiedWords = filters.minCopiedWords ?? 5

    const scanId = crypto.randomUUID()
    const fileBase64 = await fileToBase64(file)
    const webhookUrl = `${API_BASE_URL}/api/copyleaks/webhook`
    console.log('[Submit] Webhook URL sent to Copyleaks:', webhookUrl)

    const token = await getCopyleaksToken()
    
    await submitScan({
      token,
      scanId,
      fileBase64,
      fileName: file.name,
      webhookUrl,
      sandbox: true,
      ignoreReferences,
      ignoreQuotes,
      minCopiedWords,
    })

    return NextResponse.json({ scanId })
  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json(
      { error: 'Failed to submit scan' },
      { status: 500 }
    )
  }
}