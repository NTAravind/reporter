# Plagiarism Checker — Implementation Plan
**Stack:** Next.js 14 (App Router) · Shadcn UI · Copyleaks API · No DB

---

## Project Structure

```
plagiarism-checker/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # Upload UI
│   └── api/
│       ├── copyleaks/
│       │   ├── auth/route.ts           # POST → get Copyleaks JWT
│       │   ├── submit/route.ts         # POST → submit scan
│       │   └── webhook/route.ts        # POST → receive results from Copyleaks
│       └── report/[scanId]/route.ts    # GET → fetch completed report
├── components/
│   ├── upload-zone.tsx                 # Drag & drop file uploader
│   ├── report/
│   │   ├── report-shell.tsx            # Layout wrapper for report
│   │   ├── score-badge.tsx             # Overall % with color coding
│   │   ├── sources-table.tsx           # Matched sources list
│   │   ├── highlighted-text.tsx        # Paper with highlighted matches
│   │   ├── source-breakdown.tsx        # Per-source line matches
│   │   ├── match-type-legend.tsx       # Exact vs paraphrased
│   │   ├── citation-section.tsx        # Cited vs uncited similarity
│   │   ├── filters-panel.tsx           # Exclusions (refs, quotes, min length)
│   │   ├── metadata-card.tsx           # Filename, word count, scan date
│   │   └── risk-banner.tsx             # Low/Med/High + suggestions
│   └── ui/                             # shadcn components
├── lib/
│   ├── copyleaks.ts                    # API client + types
│   ├── report-parser.ts                # Transform raw API response → UI shape
│   └── constants.ts                    # Thresholds, colors, config
├── types/
│   └── report.ts                       # Shared TypeScript interfaces
└── .env.local
```

---

## Environment Variables

```env
COPYLEAKS_EMAIL=your@email.com
COPYLEAKS_API_KEY=your_api_key
COPYLEAKS_WEBHOOK_SECRET=optional_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Phase 1 — Auth & API Client

**File:** `lib/copyleaks.ts`

```typescript
// Copyleaks base URLs
const AUTH_URL  = 'https://id.copyleaks.com/v3/account/login/api'
const SCAN_URL  = 'https://api.copyleaks.com/v3/businesses/submit/file/{scanId}'

export async function getCopyleaksToken(): Promise<string> {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.COPYLEAKS_EMAIL,
      key:   process.env.COPYLEAKS_API_KEY,
    }),
  })
  const data = await res.json()
  return data.access_token   // JWT, valid for a limited window
}

export async function submitScan(
  token: string,
  scanId: string,
  fileBase64: string,
  fileName: string,
  webhookUrl: string
) {
  await fetch(SCAN_URL.replace('{scanId}', scanId), {
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
        sandbox: false,               // set true during dev to avoid credits
        filters: {
          ignoredWords: [],
          references: false,          // user-controlled in UI
          quotes: false,              // user-controlled in UI
          minCopiedWords: 5,          // ignore matches < 5 words
        },
      },
    }),
  })
}
```

---

## Phase 2 — API Routes

### `app/api/copyleaks/auth/route.ts`
- POST handler
- Calls `getCopyleaksToken()`
- Returns `{ token }` to client (short-lived, needed for status polling)

### `app/api/copyleaks/submit/route.ts`
- POST handler
- Accepts: `FormData` with `file` (PDF/DOCX/TXT) + filter settings from UI
- Generates a `scanId` (`crypto.randomUUID()`)
- Converts file to base64
- Calls `submitScan()`
- Returns `{ scanId }` immediately — scan is async

### `app/api/copyleaks/webhook/route.ts`
- POST handler — Copyleaks calls this when scan completes
- Receives scan results payload
- Stores result in-memory (see Note below) keyed by `scanId`
- Returns 200

> **Note on No-DB storage:** Since there's no DB, use a module-level `Map<string, ReportData>` in a singleton file (`lib/store.ts`). Works for dev/single-instance. For production, swap with Redis or Upstash (1 line change).

### `app/api/report/[scanId]/route.ts`
- GET handler
- Polls the in-memory store for `scanId`
- Returns `{ status: 'pending' }` or `{ status: 'done', report: ReportData }`

---

## Phase 3 — Upload UI (`app/page.tsx`)

**Flow:**
1. User drags/drops or selects PDF, DOCX, or TXT file
2. Filter toggles shown: ignore references, ignore quotes, min match length
3. "Check Plagiarism" button → POST to `/api/copyleaks/submit`
4. Show a progress indicator + polling loop (every 5s) hitting `/api/report/{scanId}`
5. On `status: 'done'` → render `<ReportShell report={data} />`

**Components used from shadcn:** `Button`, `Card`, `Progress`, `Switch`, `Slider`, `Badge`, `Tabs`, `Separator`, `Alert`

---

## Phase 4 — Report Components

### `score-badge.tsx`
- Displays `{score}% similarity`
- Color logic:
  - `< 15%` → green (low risk)
  - `15–30%` → amber (medium)
  - `> 30%` → red (high risk)
- Ring/donut visual around the percentage

### `sources-table.tsx`
- Table: Source Name | Type (web/journal/paper) | % Contribution | Link
- Sortable by contribution %
- Badge per type (shadcn `Badge` with variant)

### `highlighted-text.tsx`
- Renders the full paper text
- Highlights matched spans using `<mark>` with per-source color
- Color legend strip at top linking color → source name
- Two highlight styles: solid (exact match) vs striped/dashed (paraphrased)

### `source-breakdown.tsx`
- Accordion per source (shadcn `Accordion`)
- Shows: matched line ranges + the matched text snippet
- Expandable

### `citation-section.tsx`
- Two stat cards side by side:
  - **Cited similarity** (okay) — blue
  - **Uncited similarity** (problem) — red
- Copyleaks returns this distinction in the payload

### `filters-panel.tsx`
- Applied at submit time, but shown in report header as "Scan Settings"
- Displays which exclusions were active during scan

### `metadata-card.tsx`
- File name, file type, word count, page count, scan date/time
- Simple key-value grid

### `risk-banner.tsx`
- Based on score thresholds:
  - Low: "Your paper is within acceptable similarity range"
  - Medium: "Review highlighted sections — some uncited matches found"
  - High: "High similarity detected — revision recommended"
- Bulleted suggestions pulled from uncited matches (e.g., "Section 3, lines 42-45 closely match [source]")

---

## Phase 5 — Report Parser (`lib/report-parser.ts`)

Transform raw Copyleaks webhook payload into a clean internal `ReportData` type:

```typescript
export interface ReportData {
  scanId: string
  scannedAt: string
  fileName: string
  wordCount: number
  overallScore: number           // 0–100
  citedScore: number
  uncitedScore: number
  sources: Source[]
  matches: TextMatch[]           // spans with source ref
  riskLevel: 'low' | 'medium' | 'high'
  suggestions: string[]
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
  start: number                  // char index in original text
  end: number
  sourceId: string
  matchType: 'exact' | 'paraphrased'
}
```

---

## Phase 6 — Copyleaks Sandbox Mode (Dev)

Set in submit payload: `sandbox: true`
- No credits consumed
- Returns mock/simulated results
- Switch to `false` for real scans

---

## Copyleaks Free Tier Limits

| Limit | Value |
|-------|-------|
| Free pages/month | 250 |
| Supported formats | PDF, DOCX, TXT, HTML |
| Webhook required? | Yes (results are async) |
| Sandbox mode | Yes (for dev) |

For local dev, expose webhook via **ngrok:** `ngrok http 3000` → use the HTTPS URL as `NEXT_PUBLIC_APP_URL`.

---

## Implementation Order

```
1. Set up Next.js + shadcn  (npx create-next-app, npx shadcn init)
2. lib/copyleaks.ts          Auth + submit functions
3. api/copyleaks/auth        Token route
4. api/copyleaks/submit      File upload + scan trigger
5. lib/store.ts              In-memory result store
6. api/copyleaks/webhook     Receive + store results
7. api/report/[scanId]       Polling endpoint
8. app/page.tsx              Upload UI + polling logic
9. lib/report-parser.ts      Raw → ReportData transform
10. components/report/*      All report UI components
11. Wire everything together + test with sandbox mode
12. Flip sandbox: false → test with real file
```

---

## Key Copyleaks Docs

- Auth: `https://api.copyleaks.com/documentation/v3/account/login`
- Submit file: `https://api.copyleaks.com/documentation/v3/businesses/submit/file`
- Webhook payload: `https://api.copyleaks.com/documentation/v3/webhooks`
- Result export: `https://api.copyleaks.com/documentation/v3/downloads/report`
