'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { EntityData } from '@/redux/api/transactionsApi'
import { useSaveNerFeedbackMutation } from '@/redux/api/nerFeedbackApi'

interface Props {
  emailBody: string
  entities?: EntityData[]
  transactionId: string
  nerModelVersion?: string
}

type EditableEntity = {
  label: 'AMOUNT' | 'MERCHANT'
  start: number
  end: number
  text: string
}

export const EmailContentSection = ({
  emailBody,
  entities = [],
  transactionId,
  nerModelVersion,
}: Props) => {
  const [expanded, setExpanded] = useState(false)
  const [userEntities, setUserEntities] = useState<EditableEntity[]>(
    entities.map(e => ({
      label: e.label as any,
      start: e.start,
      end: e.end,
      text: e.text,
    }))
  )

  const [saveFeedback, { isLoading }] = useSaveNerFeedbackMutation()

  /*
  -------------------------
  TEXT SELECTION HANDLER
  -------------------------
  */

  const handleSelection = () => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return

    const text = sel.toString()
    if (!text.trim()) return

    const start = emailBody.indexOf(text)
    if (start === -1) return

    const end = start + text.length

    const label = window.prompt('Label this selection: AMOUNT or MERCHANT')

    if (label !== 'AMOUNT' && label !== 'MERCHANT') return

    setUserEntities(prev => [
      ...prev,
      { label, start, end, text },
    ])

    sel.removeAllRanges()
  }

  /*
  -------------------------
  HIGHLIGHT RENDERING
  -------------------------
  */

  const highlighted = useMemo(() => {
    const sorted = [...userEntities].sort((a, b) => a.start - b.start)

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
          className={`px-1 rounded font-bold cursor-pointer ${color}`}
          onClick={() =>
            setUserEntities(prev =>
              prev.filter((_, idx) => idx !== i)
            )
          }
          title="Click to remove"
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
  }, [emailBody, userEntities])

  /*
  -------------------------
  SAVE FEEDBACK
  -------------------------
  */

  const save = async () => {
    try {
      await saveFeedback({
        transactionId,
        emailText: emailBody,
        modelEntities: entities,
        correctedEntities: userEntities,
        nerModelVersion,
      }).unwrap()

      alert('Feedback saved!')
    } catch {
      alert('Failed to save feedback')
    }
  }

  const isLong = emailBody.length > 180

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
        Email Content (Editable)
      </p>

      <div
        onMouseUp={handleSelection}
        className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-border/40 text-sm whitespace-pre-wrap select-text cursor-text"
      >
        {!expanded && isLong
          ? emailBody.slice(0, 180) + '…'
          : highlighted}
      </div>

      <div className="flex justify-between">
        {isLong && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(v => !v)}
          >
            {expanded ? 'Show less' : 'Show more'}
          </Button>
        )}

        <Button
          size="sm"
          onClick={save}
          disabled={isLoading}
        >
          Save Feedback
        </Button>
      </div>
    </div>
  )
}
