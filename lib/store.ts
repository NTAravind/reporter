import { ReportData } from '@/types/report'

const reportStore = new Map<string, ReportData>()

export function storeReport(scanId: string, report: ReportData) {
  reportStore.set(scanId, report)
}

export function getReport(scanId: string): ReportData | undefined {
  return reportStore.get(scanId)
}

export function hasReport(scanId: string): boolean {
  return reportStore.has(scanId)
}