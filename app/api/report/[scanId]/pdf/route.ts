import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { getReport } from '@/lib/store'

interface RouteParams {
  params: Promise<{ scanId: string }>
}

const COLORS = {
  navy: rgb(0.07, 0.18, 0.42),
  green: rgb(0.23, 0.43, 0.07),
  amber: rgb(0.52, 0.31, 0.04),
  red: rgb(0.64, 0.17, 0.17),
  blue: rgb(0.18, 0.38, 0.72),
  gray: rgb(0.5, 0.5, 0.5),
  lightGray: rgb(0.95, 0.95, 0.95),
}

const MARGIN = 50
const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89

function getScoreColor(score: number) {
  if (score < 15) return COLORS.green
  if (score <= 30) return COLORS.amber
  return COLORS.red
}

function getRiskLevel(score: number): string {
  if (score < 15) return 'LOW'
  if (score <= 30) return 'MEDIUM'
  return 'HIGH'
}

async function generatePdf(report: Awaited<ReturnType<typeof getReport>>) {
  if (!report) throw new Error('Report not found')

  const pdfDoc = await PDFDocument.create()
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const scoreColor = getScoreColor(report.overallScore)
  const riskLevel = getRiskLevel(report.overallScore)

  const totalPages = Math.ceil((report.sources.length + report.text.length / 2000) / 3) + 2

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  page.drawText('Plagiarism Report', {
    x: MARGIN,
    y: y,
    size: 24,
    font: helveticaBold,
    color: COLORS.navy,
  })
  y -= 40

  y -= 20
  page.drawText('Document Information', {
    x: MARGIN,
    y: y,
    size: 14,
    font: helveticaBold,
    color: COLORS.navy,
  })
  page.drawLine({
    start: { x: MARGIN, y: y - 5 },
    end: { x: PAGE_WIDTH - MARGIN, y: y - 5 },
    thickness: 1,
    color: COLORS.navy,
  })
  y -= 25

  const metadata = [
    ['File Name:', report.fileName],
    ['Word Count:', report.wordCount.toLocaleString()],
    ['Scan Date:', new Date(report.scannedAt).toLocaleString()],
  ]

  for (const [label, value] of metadata) {
    page.drawText(label, { x: MARGIN, y: y, size: 10, font: helveticaBold })
    page.drawText(value, { x: MARGIN + 100, y: y, size: 10, font: helvetica })
    y -= 15
  }
  y -= 20

  const scoreCircleX = PAGE_WIDTH / 2
  const scoreCircleY = y - 60
  const radius = 50
  page.drawCircle({ x: scoreCircleX, y: scoreCircleY, size: radius, borderColor: scoreColor, borderWidth: 4 })

  const scoreText = `${Math.round(report.overallScore)}%`
  const scoreWidth = helveticaBold.widthOfTextAtSize(scoreText, 28)
  page.drawText(scoreText, { x: scoreCircleX - scoreWidth / 2, y: scoreCircleY - 10, size: 28, font: helveticaBold, color: scoreColor })
  y -= 100

  const riskWidth = 80
  const riskX = (PAGE_WIDTH - riskWidth) / 2
  page.drawRectangle({ x: riskX, y: y - 20, width: riskWidth, height: 25, color: scoreColor })
  const riskText = `${riskLevel} RISK`
  const riskTextWidth = helveticaBold.widthOfTextAtSize(riskText, 10)
  page.drawText(riskText, { x: riskX + (riskWidth - riskTextWidth) / 2, y: y - 10, size: 10, font: helveticaBold, color: rgb(1, 1, 1) })
  y -= 50

  const boxWidth = (PAGE_WIDTH - 2 * MARGIN - 20) / 2
  const boxHeight = 60
  page.drawRectangle({ x: MARGIN, y: y - boxHeight, width: boxWidth, height: boxHeight, color: rgb(0.9, 0.95, 1) })
  page.drawText('Cited Similarity', { x: MARGIN + 10, y: y - 20, size: 10, font: helvetica, color: COLORS.navy })
  page.drawText(`${report.citedScore.toFixed(1)}%`, { x: MARGIN + 10, y: y - 40, size: 18, font: helveticaBold, color: COLORS.blue })

  page.drawRectangle({ x: MARGIN + boxWidth + 20, y: y - boxHeight, width: boxWidth, height: boxHeight, color: rgb(1, 0.95, 0.95) })
  page.drawText('Uncited Similarity', { x: MARGIN + boxWidth + 30, y: y - 20, size: 10, font: helvetica, color: COLORS.red })
  page.drawText(`${report.uncitedScore.toFixed(1)}%%`, { x: MARGIN + boxWidth + 30, y: y - 40, size: 18, font: helveticaBold, color: COLORS.red })
  y -= boxHeight + 30

  if (report.suggestions.length > 0) {
    page.drawText('Suggestions', { x: MARGIN, y: y, size: 14, font: helveticaBold, color: COLORS.navy })
    page.drawLine({ start: { x: MARGIN, y: y - 5 }, end: { x: PAGE_WIDTH - MARGIN, y: y - 5 }, thickness: 1, color: COLORS.navy })
    y -= 20
    for (const suggestion of report.suggestions) {
      page.drawText('•', { x: MARGIN, y: y, size: 10, font: helvetica })
      page.drawText(suggestion, { x: MARGIN + 15, y: y, size: 10, font: helvetica })
      y -= 15
    }
  }

  page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  addHeader(page, report.fileName, helvetica)

  let pageY = PAGE_HEIGHT - MARGIN - 30

  page.drawText('Matched Sources', { x: MARGIN, y: pageY, size: 14, font: helveticaBold, color: COLORS.navy })
  page.drawLine({ start: { x: MARGIN, y: pageY - 5 }, end: { x: PAGE_WIDTH - MARGIN, y: pageY - 5 }, thickness: 1, color: COLORS.navy })
  pageY -= 25

  const tableHeaders = ['#', 'Source Name', 'Type', 'Contribution', 'Cited?']
  const colWidths = [30, 200, 60, 100, 50]
  let x = MARGIN
  for (let i = 0; i < tableHeaders.length; i++) {
    page.drawText(tableHeaders[i], { x: x, y: pageY, size: 10, font: helveticaBold, color: COLORS.navy })
    x += colWidths[i]
  }
  pageY -= 18

  for (let i = 0; i < report.sources.length; i++) {
    const source = report.sources[i]
    const rowGray = i % 2 === 1
    if (rowGray) {
      page.drawRectangle({ x: MARGIN, y: pageY - 12, width: PAGE_WIDTH - 2 * MARGIN, height: 18, color: COLORS.lightGray })
    }

    x = MARGIN
    page.drawText(String(i + 1), { x: x, y: pageY, size: 9, font: helvetica })
    x += colWidths[0]

    const sourceName = source.name.length > 40 ? source.name.slice(0, 40) + '...' : source.name
    page.drawText(sourceName, { x: x, y: pageY, size: 9, font: helvetica })
    x += colWidths[1]

    page.drawText(source.type, { x: x, y: pageY, size: 9, font: helvetica })
    x += colWidths[2]

    const contribPercent = source.contributionPercent / 100
    const barWidth = 60 * contribPercent
    page.drawRectangle({ x: x, y: pageY - 2, width: barWidth, height: 6, color: COLORS.navy })
    page.drawText(`${source.contributionPercent.toFixed(1)}%`, { x: x + 65, y: pageY, size: 9, font: helvetica })
    x += colWidths[3]

    page.drawText(source.isCited ? 'Yes' : 'No', { x: x, y: pageY, size: 9, font: helvetica, color: source.isCited ? COLORS.green : COLORS.red })
    pageY -= 18

    if (pageY < MARGIN + 50) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      addHeader(page, report.fileName, helvetica)
      pageY = PAGE_HEIGHT - MARGIN - 30
    }
  }

  page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  addHeader(page, report.fileName, helvetica)
  pageY = PAGE_HEIGHT - MARGIN - 30

  page.drawText('Source Breakdown', { x: MARGIN, y: pageY, size: 14, font: helveticaBold, color: COLORS.navy })
  page.drawLine({ start: { x: MARGIN, y: pageY - 5 }, end: { x: PAGE_WIDTH - MARGIN, y: pageY - 5 }, thickness: 1, color: COLORS.navy })
  pageY -= 25

  for (const source of report.sources) {
    page.drawText(source.name, { x: MARGIN, y: pageY, size: 12, font: helveticaBold, color: COLORS.navy })
    pageY -= 15
    page.drawText(`Type: ${source.type} | Contribution: ${source.contributionPercent.toFixed(1)}% | ${source.isCited ? 'Cited' : 'Uncited'}`, { x: MARGIN, y: pageY, size: 9, font: helvetica, color: COLORS.gray })
    pageY -= 15
    page.drawText(`URL: ${source.url || 'N/A'}`, { x: MARGIN, y: pageY, size: 8, font: helvetica, color: COLORS.gray })
    pageY -= 20

    const sourceMatches = report.matches.filter(m => m.sourceId === source.id)
    if (sourceMatches.length > 0) {
      for (const match of sourceMatches.slice(0, 3)) {
        const matchType = match.matchType === 'exact' ? '[EXACT]' : '[PARAPHRASED]'
        const textExcerpt = report.text.slice(Math.max(0, match.start - 30), match.end + 30)
        const wrapped = wrapText(textExcerpt, PAGE_WIDTH - 2 * MARGIN, helvetica, 9)
        for (const line of wrapped) {
          if (pageY < MARGIN + 50) {
            page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
            addHeader(page, report.fileName, helvetica)
            pageY = PAGE_HEIGHT - MARGIN - 30
          }
          page.drawText(matchType + ' ' + line, { x: MARGIN, y: pageY, size: 8, font: helvetica, color: COLORS.gray })
          pageY -= 12
        }
      }
    }
    pageY -= 10

    if (pageY < MARGIN + 50) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      addHeader(page, report.fileName, helvetica)
      pageY = PAGE_HEIGHT - MARGIN - 30
    }
  }

  page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  addHeader(page, report.fileName, helvetica)
  pageY = PAGE_HEIGHT - MARGIN - 30

  page.drawText('Document Analysis', { x: MARGIN, y: pageY, size: 14, font: helveticaBold, color: COLORS.navy })
  page.drawLine({ start: { x: MARGIN, y: pageY - 5 }, end: { x: PAGE_WIDTH - MARGIN, y: pageY - 5 }, thickness: 1, color: COLORS.navy })
  pageY -= 25

  const textWidth = PAGE_WIDTH - 2 * MARGIN
  const sortedMatches = [...report.matches].sort((a, b) => a.start - b.start)
  let lastEnd = 0
  let sourceIndex = 0
  const sourceNames: Record<string, string> = {}
  report.sources.forEach((s, i) => { sourceNames[s.id] = `Source ${i + 1}` })

  for (const match of sortedMatches) {
    if (match.start > lastEnd) {
      const plainText = report.text.slice(lastEnd, match.start)
      const wrapped = wrapText(plainText, textWidth, helvetica, 9)
      for (const line of wrapped) {
        if (pageY < MARGIN + 50) {
          page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
          addHeader(page, report.fileName, helvetica)
          pageY = PAGE_HEIGHT - MARGIN - 30
        }
        page.drawText(line, { x: MARGIN, y: pageY, size: 9, font: helvetica })
        pageY -= 12
      }
    }

    const sourceName = sourceNames[match.sourceId] || 'Unknown'
    const highlightedText = `<<${report.text.slice(match.start, match.end)} [${sourceName}]>>`
    const wrapped = wrapText(highlightedText, textWidth, helvetica, 9)
    for (const line of wrapped) {
      if (pageY < MARGIN + 50) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
        addHeader(page, report.fileName, helvetica)
        pageY = PAGE_HEIGHT - MARGIN - 30
      }
      page.drawText(line, { x: MARGIN, y: pageY, size: 9, font: helvetica, color: COLORS.navy })
      pageY -= 12
    }

    lastEnd = match.end
    sourceIndex++
  }

  if (lastEnd < report.text.length) {
    const remainingText = report.text.slice(lastEnd)
    const wrapped = wrapText(remainingText, textWidth, helvetica, 9)
    for (const line of wrapped) {
      if (pageY < MARGIN + 50) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
        addHeader(page, report.fileName, helvetica)
        pageY = PAGE_HEIGHT - MARGIN - 30
      }
      page.drawText(line, { x: MARGIN, y: pageY, size: 9, font: helvetica })
      pageY -= 12
    }
  }

  pageY -= 20
  page.drawText('Highlighted spans indicate similarity matches. See source breakdown for details.', { x: MARGIN, y: pageY, size: 8, font: helvetica, color: COLORS.gray })

  const pages = pdfDoc.getPages()
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i]
    const { width } = p.getSize()
    const pageNum = i + 1
    const pageText = `Page ${pageNum} of ${pages.length}`
    const textWidth2 = helvetica.widthOfTextAtSize(pageText, 8)
    p.drawText(pageText, { x: (width - textWidth2) / 2, y: 30, size: 8, font: helvetica, color: COLORS.gray })
  }

  return pdfDoc.save()
}

function addHeader(page: Awaited<ReturnType<PDFDocument['addPage']>>, fileName: string, font: Awaited<ReturnType<PDFDocument['embedFont']>>) {
  const headerText = `Plagiarism Report — ${fileName}`
  const textWidth = font.widthOfTextAtSize(headerText, 8)
  page.drawText(headerText, { x: PAGE_WIDTH - MARGIN - textWidth, y: PAGE_HEIGHT - 30, size: 8, font, color: COLORS.gray })
}

function wrapText(text: string, maxWidth: number, font: Awaited<ReturnType<PDFDocument['embedFont']>>, fontSize: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const width = font.widthOfTextAtSize(testLine, fontSize)
    if (width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { scanId } = await params
  const report = getReport(scanId)

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  try {
    const pdfBytes: Uint8Array = await generatePdf(report)
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="plagiarism-report-${scanId}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}