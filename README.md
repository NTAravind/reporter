# Plagiarism Checker

A Next.js 14 application for checking documents for plagiarism using the Copyleaks API.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.local.example` to `.env.local` and add your Copyleaks credentials:
   ```
   COPYLEAKS_EMAIL=your@email.com
   COPYLEAKS_API_KEY=your_api_key
   COPYLEAKS_WEBHOOK_SECRET=optional_secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `COPYLEAKS_EMAIL` | Your Copyleaks account email |
| `COPYLEAKS_API_KEY` | Your Copyleaks API key |
| `COPYLEAKS_WEBHOOK_SECRET` | Optional secret for webhook verification |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app (for webhook) |

## Tech Stack

- Next.js 14 (App Router)
- Shadcn UI
- Copyleaks API
- TypeScript
- Tailwind CSS

## Features

- Drag & drop file upload (PDF, DOCX, TXT)
- Configurable scan filters (ignore references, quotes, min match length)
- Real-time polling for scan results
- Detailed report with:
  - Overall similarity score
  - Cited vs uncited similarity breakdown
  - Source list with contribution percentages
  - Highlighted text view
  - Risk assessment and suggestions# reporter
