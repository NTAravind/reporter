'use client'

import { Source } from '@/types/report'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface SourceBreakdownProps {
  sources: Source[]
}

export function SourceBreakdown({ sources }: SourceBreakdownProps) {
  return (
    <Accordion className="w-full">
      {sources.map((source) => (
        <AccordionItem key={source.id} value={source.id}>
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <span className="font-medium text-left">{source.name}</span>
              <span className="text-sm text-muted-foreground">
                {source.contributionPercent.toFixed(1)}%
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-sm">
              {source.url && (
                <div>
                  <span className="font-medium">URL:</span>{' '}
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {source.url}
                  </a>
                </div>
              )}
              <div>
                <span className="font-medium">Type:</span> {source.type}
              </div>
              <div>
                <span className="font-medium">Status:</span>{' '}
                {source.isCited ? 'Cited' : 'Uncited'}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}