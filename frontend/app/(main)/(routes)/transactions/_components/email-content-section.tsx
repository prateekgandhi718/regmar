'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { EntityData } from '@/redux/api/transactionsApi'

interface Props {
  emailBody: string
  entities?: EntityData[]
  truncateLength?: number
}

export const EmailContentSection = ({
  emailBody,
  entities = [],
  truncateLength = 180,
}: Props) => {
  const [expanded, setExpanded] = useState(false)

  const highlighted = useMemo(() => {
    if (!emailBody) return null

    const sorted = [...entities]
      .filter(e => e.label === 'AMOUNT' || e.label === 'MERCHANT')
      .sort((a, b) => a.start - b.start)

    const nodes: React.ReactNode[] = []
    let cursor = 0

    sorted.forEach((entity, i) => {
      if (cursor < entity.start) {
        nodes.push(emailBody.slice(cursor, entity.start))
      }

      const color =
        entity.label === 'AMOUNT'
          ? 'bg-emerald-200 dark:bg-emerald-800'
          : 'bg-indigo-200 dark:bg-indigo-800'

      nodes.push(
        <span
          key={i}
          className={`px-1 rounded font-bold ${color}`}
        >
          {emailBody.slice(entity.start, entity.end)}
        </span>
      )

      cursor = entity.end
    })

    if (cursor < emailBody.length) {
      nodes.push(emailBody.slice(cursor))
    }

    return nodes
  }, [emailBody, entities])

  const isLong = emailBody.length > truncateLength
  const displayText =
    !expanded && isLong
      ? emailBody.slice(0, truncateLength)
      : null

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
        Email Content
      </p>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-border/40 text-sm leading-relaxed whitespace-pre-wrap">
        {!expanded && isLong ? (
          <>
            {displayText}…
          </>
        ) : (
          highlighted
        )}

        {isLong && (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(v => !v)}
              className="font-bold text-xs uppercase text-primary"
            >
              {expanded ? 'Show less' : 'Show more'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
