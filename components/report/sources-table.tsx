'use client'

import { Source } from '@/types/report'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface SourcesTableProps {
  sources: Source[]
}

export function SourcesTable({ sources }: SourcesTableProps) {
  const getTypeBadgeVariant = (type: 'web' | 'journal' | 'database') => {
    switch (type) {
      case 'journal':
        return 'default'
      case 'database':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Contribution</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map((source) => (
            <TableRow key={source.id}>
              <TableCell className="font-medium">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-primary"
                  >
                    {source.name}
                  </a>
                ) : (
                  source.name
                )}
              </TableCell>
              <TableCell>
                <Badge variant={getTypeBadgeVariant(source.type)}>
                  {source.type}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {source.contributionPercent.toFixed(1)}%
              </TableCell>
              <TableCell>
                <Badge variant={source.isCited ? 'default' : 'destructive'}>
                  {source.isCited ? 'Cited' : 'Uncited'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}