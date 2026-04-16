const AUTH_URL = 'https://id.copyleaks.com/v3/account/login/api'
const SCAN_URL = 'https://api.copyleaks.com/v3/businesses/submit/file'

export interface SubmitScanOptions {
  token: string
  scanId: string
  fileBase64: string
  fileName: string
  webhookUrl: string
  sandbox?: boolean
  ignoreReferences?: boolean
  ignoreQuotes?: boolean
  minCopiedWords?: number
}

export async function getCopyleaksToken(): Promise<string> {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.COPYLEAKS_EMAIL,
      key: process.env.COPYLEAKS_API_KEY,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Copyleaks auth failed: ${error}`)
  }

  const data = await res.json()
  return data.access_token
}

export async function submitScan(options: SubmitScanOptions) {
  const {
    token,
    scanId,
    fileBase64,
    fileName,
    webhookUrl,
    sandbox = true,
    ignoreReferences = false,
    ignoreQuotes = false,
    minCopiedWords = 5,
  } = options

  const res = await fetch(`${SCAN_URL}/${scanId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base64: fileBase64,
      filename: fileName,
      properties: {
        webhooks: {
          status: `${webhookUrl}/{STATUS}/${scanId}`,
        },
        sandbox,
        filters: {
          ignoredWords: [],
          references: ignoreReferences,
          quotes: ignoreQuotes,
          minCopiedWords,
        },
      },
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Copyleaks submit failed: ${error}`)
  }
}

export async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return buffer.toString('base64')
}