'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Banknote, Store, X, AlertCircle, ShieldCheck, ShieldX, CreditCard } from 'lucide-react'

import { EntityData } from '@/redux/api/transactionsApi'
import { useSaveNerFeedbackMutation } from '@/redux/api/nerFeedbackApi'
import { useSaveTxnClassifierFeedbackMutation } from '@/redux/api/txnClassifierApi'
import { toast } from 'sonner'

interface Props {
  emailBody: string
  entities: EntityData[]
  correctedEntities: EntityData[] | null
  transactionId: string
  nerModelVersion?: string
  type?: 'credit' | 'debit'
  typeConfidence?: number
  isTransactionConfidence?: number
  sourceDomain?: string
  userType?: 'credit' | 'debit'
  onTransactionDeleted?: () => void
}

type EditableEntity = {
  label: 'AMOUNT' | 'MERCHANT'
  start: number
  end: number
  text: string
  source: 'model' | 'user'
}

export const EmailContentSection = ({
  emailBody = '',
  entities = [],
  correctedEntities,
  transactionId,
  nerModelVersion,
  type,
  typeConfidence,
  isTransactionConfidence,
  sourceDomain,
  userType,
  onTransactionDeleted,
}: Props) => {
  const [saveFeedback, { isLoading }] = useSaveNerFeedbackMutation()
  const [saveTxnFeedback, { isLoading: isSavingTxnFeedback }] = useSaveTxnClassifierFeedbackMutation()

  // 1. Initialize states
  const modelEntities: EditableEntity[] = useMemo(
    () =>
      entities.map((e) => ({
        label: e.label as 'AMOUNT' | 'MERCHANT',
        start: e.start,
        end: e.end,
        text: e.text,
        source: 'model',
      })),
    [entities],
  )

  const [userEntities, setUserEntities] = useState<EditableEntity[]>(
    (correctedEntities ?? []).map((e) => ({
      label: e.label as 'AMOUNT' | 'MERCHANT',
      start: e.start,
      end: e.end,
      text: e.text,
      source: 'user',
    })),
  )

  const [expanded, setExpanded] = useState(false)
  const [selectionData, setSelectionData] = useState<{
    text: string
    start: number
    end: number
  } | null>(null)
  const [txnPopoverOpen, setTxnPopoverOpen] = useState(false)
  const [typePopoverOpen, setTypePopoverOpen] = useState(false)
  const [confirmedTxn, setConfirmedTxn] = useState(false)
  const [confirmedType, setConfirmedType] = useState(false)
  const [localTxnType, setLocalTxnType] = useState<'credit' | 'debit' | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (userType) {
      setLocalTxnType(userType)
      setConfirmedTxn(true)
      setConfirmedType(true)
    }
  }, [userType])

  const annotationsEnabled = confirmedTxn && confirmedType && Boolean(localTxnType)

  // 2. Mobile-Friendly Text Selection Logic
  useEffect(() => {
    if (!annotationsEnabled) {
      setSelectionData(null)
      return
    }
    const handleSelectionChange = () => {
      if (!containerRef.current) return

      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelectionData(null)
        return
      }

      // Ensure selection is inside our text container
      if (!containerRef.current.contains(sel.anchorNode)) {
        return
      }

      const range = sel.getRangeAt(0)
      const preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(containerRef.current)
      preCaretRange.setEnd(range.startContainer, range.startOffset)

      const start = preCaretRange.toString().length
      const text = range.toString()
      const end = start + text.length

      if (text.trim()) {
        setSelectionData({ text: text.trim(), start, end })
      } else {
        setSelectionData(null)
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [annotationsEnabled])

  // 3. Update User Tags (Enforcing Max 1 per label)
  const handleTagSelection = (label: 'AMOUNT' | 'MERCHANT') => {
    if (!selectionData) return

    setUserEntities((prev) => {
      const filtered = prev.filter((e) => e.label !== label) // Remove existing tag for this label
      return [
        ...filtered,
        {
          label,
          start: selectionData.start,
          end: selectionData.end,
          text: selectionData.text,
          source: 'user',
        },
      ]
    })

    // Clear native selection gracefully
    window.getSelection()?.removeAllRanges()
    setSelectionData(null)
  }

  const removeUserEntity = (label: 'AMOUNT' | 'MERCHANT') => {
    setUserEntities((prev) => prev.filter((e) => e.label !== label))
  }

  const formatConfidence = (value?: number) => {
    if (typeof value !== 'number') return 'n/a'
    return `${Math.round(value * 100)}% sure`
  }

  const confidenceTone = (value?: number) => {
    if (typeof value !== 'number') return 'border-muted-foreground/40 bg-muted/20 text-muted-foreground'
    if (value < 0.6) return 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700/60 dark:bg-rose-950/40 dark:text-rose-200'
    if (value < 0.8) return 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200'
    return 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-200'
  }

  const handleTxnConfirmed = () => {
    setConfirmedTxn(true)
    setTxnPopoverOpen(false)
    setTypePopoverOpen(true)
  }

  const handleTxnRejected = async () => {
    try {
      await saveTxnFeedback({
        transactionId,
        emailText: emailBody,
        sourceDomain,
        isTransaction: false,
        modelConfidence: isTransactionConfidence,
        typeConfidence,
      }).unwrap()
      toast.success('Thanks for the feedback!', { position: 'bottom-center' })
      onTransactionDeleted?.()
    } catch {
      toast.error('Failed to save feedback.', { position: 'bottom-center' })
    } finally {
      setTxnPopoverOpen(false)
    }
  }

  const handleTypeSelection = async (selectedType: 'credit' | 'debit') => {
    try {
      await saveTxnFeedback({
        transactionId,
        emailText: emailBody,
        sourceDomain,
        isTransaction: true,
        txnType: selectedType,
        modelConfidence: isTransactionConfidence,
        typeConfidence,
      }).unwrap()
      setLocalTxnType(selectedType)
      setConfirmedTxn(true)
      setConfirmedType(true)
      toast.success('Thanks for the feedback!', { position: 'bottom-center' })
    } catch {
      toast.error('Failed to save feedback.', { position: 'bottom-center' })
    } finally {
      setTypePopoverOpen(false)
    }
  }

  // 4. Safe Overlap Rendering Engine (Character State Grouping)
  const renderedChunks = useMemo(() => {
    if (!emailBody) return []

    const chunks = []
    let currentChunk = {
      text: '',
      modelAmt: false,
      modelMch: false,
      userAmt: false,
      userMch: false,
    }

    for (let i = 0; i < emailBody.length; i++) {
      const char = emailBody[i]

      const modelAmt = modelEntities.some((e) => e.label === 'AMOUNT' && i >= e.start && i < e.end)
      const modelMch = modelEntities.some((e) => e.label === 'MERCHANT' && i >= e.start && i < e.end)
      const userAmt = userEntities.some((e) => e.label === 'AMOUNT' && i >= e.start && i < e.end)
      const userMch = userEntities.some((e) => e.label === 'MERCHANT' && i >= e.start && i < e.end)

      if (i === 0 || currentChunk.modelAmt !== modelAmt || currentChunk.modelMch !== modelMch || currentChunk.userAmt !== userAmt || currentChunk.userMch !== userMch) {
        if (i !== 0) chunks.push(currentChunk)
        currentChunk = { text: char, modelAmt, modelMch, userAmt, userMch }
      } else {
        currentChunk.text += char
      }
    }
    chunks.push(currentChunk)
    return chunks
  }, [emailBody, modelEntities, userEntities])

  // 5. Save functionality
  const save = async () => {
    try {
      await saveFeedback({
        transactionId,
        emailText: emailBody,
        modelEntities: entities,
        correctedEntities: userEntities.map(({ label, start, end, text }) => ({
          label,
          start,
          end,
          text,
        })),
        nerModelVersion,
      }).unwrap()
      toast.success('Feedback successfully saved!', { position: "bottom-center" })
    } catch {
      toast.error('Failed to save feedback.',  { position: "bottom-center" })
    }
  }

  const isLong = emailBody.length > 150

  // Helpers to get active entities for the top Badges
  const uAmt = userEntities.find((e) => e.label === 'AMOUNT')
  const uMch = userEntities.find((e) => e.label === 'MERCHANT')
  const mAmt = modelEntities.find((e) => e.label === 'AMOUNT')
  const mMch = modelEntities.find((e) => e.label === 'MERCHANT')

  const hasAmount = Boolean(uAmt || mAmt)
  const hasMerchant = Boolean(uMch || mMch)
  const hasUserAnnotation = userEntities.length > 0

  const canSave = hasAmount && hasMerchant && hasUserAnnotation

  return (
    <Card className="w-full relative shadow-sm max-w-2xl mx-auto overflow-hidden">
      <CardContent className="pt-4 space-y-4">
        {/* CLASSIFICATION BADGES */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Classification</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Popover open={txnPopoverOpen} onOpenChange={setTxnPopoverOpen}>
              <PopoverTrigger asChild>
                <Badge
                  variant="outline"
                  className={`gap-2 cursor-pointer ${confidenceTone(isTransactionConfidence)}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Transaction
                  <span className="text-[10px] opacity-70">({formatConfidence(isTransactionConfidence)})</span>
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Is this a transaction?</p>
                    <p className="text-xs text-muted-foreground">Your answer improves the model.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" className="gap-2" onClick={handleTxnConfirmed} disabled={isSavingTxnFeedback}>
                      <ShieldCheck className="w-4 h-4" /> Yes
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2" onClick={handleTxnRejected} disabled={isSavingTxnFeedback}>
                      <ShieldX className="w-4 h-4" /> Not a txn
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={typePopoverOpen} onOpenChange={setTypePopoverOpen}>
              <PopoverTrigger asChild>
                <Badge
                  variant="outline"
                  className={`gap-2 cursor-pointer ${confidenceTone(typeConfidence)}`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  {type ? type.toUpperCase() : 'Type'}
                  <span className="text-[10px] opacity-70">({formatConfidence(typeConfidence)})</span>
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Debit or credit?</p>
                    <p className="text-xs text-muted-foreground">Select the correct type.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleTypeSelection('debit')} disabled={isSavingTxnFeedback}>
                      Debit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleTypeSelection('credit')} disabled={isSavingTxnFeedback}>
                      Credit
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {localTxnType && (
              <Badge
                variant="outline"
                className="inline-flex w-auto self-start gap-2 border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700/60 dark:bg-slate-950/40 dark:text-slate-200"
              >
                <CreditCard className="w-3.5 h-3.5" />
                {localTxnType.toUpperCase()} <span className="text-[10px] opacity-70">(you)</span>
              </Badge>
            )}
          </div>

          {!annotationsEnabled && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <p>Confirm transaction and type to enable annotation edits.</p>
            </div>
          )}
        </div>

        <Separator />

        {/* EMAIL DETAILS */}
        {annotationsEnabled && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Email Details</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Highlight the amount and merchant name in the email so we can improve accuracy.
          </p>
          <div className="flex flex-wrap gap-2">
            {/* Amount Badge */}
            {uAmt ? (
              <Badge
                variant="default"
                className="
              bg-emerald-500 hover:bg-emerald-600 text-white
              dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-emerald-50
              pl-2 pr-1 py-1 flex items-center gap-1 shadow-sm
              "
              >
                <Banknote className="w-3 h-3" /> {uAmt.text}
                <div onClick={() => removeUserEntity('AMOUNT')} className="ml-1 cursor-pointer bg-black/10 rounded-full p-0.5 hover:bg-black/20">
                  <X className="w-3 h-3" />
                </div>
              </Badge>
            ) : mAmt ? (
              <Badge
                variant="outline"
                className="
              border-emerald-400 bg-emerald-50 text-emerald-800
              dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200
              flex items-center gap-1
              "
              >
                <Banknote className="w-3 h-3 opacity-50" /> {mAmt.text} <span className="text-[10px] opacity-60 ml-1">(Model)</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="border-dashed text-muted-foreground opacity-50">
                <Banknote className="w-3 h-3 mr-1" /> Missing Amount
              </Badge>
            )}

            {/* Merchant Badge */}
            {uMch ? (
              <Badge
                variant="default"
                className="
              bg-indigo-500 hover:bg-indigo-600 text-white
              dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:text-indigo-50
              pl-2 pr-1 py-1 flex items-center gap-1 shadow-sm
              "
              >
                <Store className="w-3 h-3" /> {uMch.text}
                <div onClick={() => removeUserEntity('MERCHANT')} className="ml-1 cursor-pointer bg-black/10 rounded-full p-0.5 hover:bg-black/20">
                  <X className="w-3 h-3" />
                </div>
              </Badge>
            ) : mMch ? (
              <Badge
                variant="outline"
                className="
              border-indigo-400 bg-indigo-50 text-indigo-800
              dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200
              flex items-center gap-1
              "
              >
                <Store className="w-3 h-3 opacity-50" /> {mMch.text} <span className="text-[10px] opacity-60 ml-1">(Model)</span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="
              border-dashed text-muted-foreground opacity-60
              dark:text-muted-foreground/80
              "
              >
                <Store className="w-3 h-3 mr-1" /> Missing Merchant
              </Badge>
            )}
          </div>
        </div>
        )}

        {/* EMAIL BODY TEXT HIGHLIGHTER */}
        <div
          className={`
            relative bg-background rounded-lg border p-4 text-sm
            leading-relaxed whitespace-pre-wrap ${annotationsEnabled ? 'select-text' : 'select-none'}
            transition-all duration-500 ease-in-out overflow-hidden
            ${expanded ? 'max-h-[1000px]' : 'max-h-[100px]'}
          `}
        >
          <div ref={containerRef} className="outline-none">
            {renderedChunks.map((chunk, i) => {
              // Combine styles gracefully based on state
              let classes = 'transition-colors rounded-[2px] '

              // Backgrounds (User overrides model background)
              if (chunk.userAmt) classes += 'bg-emerald-200/80 dark:bg-emerald-900/60 font-medium text-emerald-950 dark:text-emerald-50 '
              else if (chunk.userMch) classes += 'bg-indigo-200/80 dark:bg-indigo-900/60 font-medium text-indigo-950 dark:text-indigo-50 '

              // Borders (Model outlines - preserved even if user overlaps slightly to show model's original intent)
              if (chunk.modelAmt && !chunk.userAmt) classes += 'border-b-2 border-dashed border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 '
              if (chunk.modelMch && !chunk.userMch) classes += 'border-b-2 border-dashed border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 '

              return (
                <span key={i} className={classes}>
                  {chunk.text}
                </span>
              )
            })}
          </div>

          {/* Faded overlay for collapsed state */}
          {!expanded && isLong && <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-background to-transparent pointer-events-none" />}
        </div>
      </CardContent>

      <CardFooter className="bg-muted/30 pt-4 flex items-center justify-between">
        {isLong ? (
          <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)} className="text-xs">
            {expanded ? 'Collapse Text' : 'Read Full Email'}
          </Button>
        ) : (
          <div />
        )}

        {annotationsEnabled ? (
          <Button size="sm" onClick={save} disabled={!canSave || isLoading} className="gap-2 shadow-sm">
            Save
          </Button>
        ) : (
          <Badge variant="outline" className="text-[10px] uppercase tracking-widest text-muted-foreground border-dashed">
            Annotation locked
          </Badge>
        )}
      </CardFooter>

      {/* MOBILE FLOATING ACTION BAR FOR SELECTION */}
      {selectionData && annotationsEnabled && (
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="bg-popover border shadow-xl rounded-xl p-3 flex flex-col gap-3 mx-auto max-w-sm">
            <div className="flex items-center gap-2 px-1">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-medium truncate text-muted-foreground">
                Selected: <span className="text-foreground font-bold">"{selectionData.text}"</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="
                text-foreground hover:bg-muted
                dark:text-zinc-200 dark:hover:bg-zinc-800
                transition-colors
  "
                onClick={() => handleTagSelection('AMOUNT')}
              >
                <Banknote className="w-4 h-4 mr-2 opacity-70" /> Amount
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="
                text-foreground hover:bg-muted
                dark:text-zinc-200 dark:hover:bg-zinc-800
                transition-colors
  "
                onClick={() => handleTagSelection('MERCHANT')}
              >
                <Store className="w-4 h-4 mr-2 opacity-70" /> Merchant
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
