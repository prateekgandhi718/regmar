'use client'

import { useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Transaction, useUpdateTransactionMutation, useDeleteTransactionMutation } from '@/redux/api/transactionsApi'
import { useGetCategoriesQuery } from '@/redux/api/categoriesApi'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Trash2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AmountInput } from '@/components/amount-input'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface EditTransactionDrawerProps {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
}

export const EditTransactionDrawer = ({ transaction, isOpen, onClose }: EditTransactionDrawerProps) => {
  const { data: categories } = useGetCategoriesQuery()
  const [updateTransaction, { isLoading: isUpdating }] = useUpdateTransactionMutation()
  const [deleteTransaction, { isLoading: isDeleting }] = useDeleteTransactionMutation()

  const initialAmount = transaction ? transaction.newAmount || transaction.originalAmount : 0
  const displayAmount = transaction?.type === 'credit' ? -initialAmount : initialAmount
  const txDate = transaction ? (transaction.newDate ? new Date(transaction.newDate) : new Date(transaction.originalDate)) : new Date()

  const [description, setDescription] = useState(transaction?.newDescription || transaction?.originalDescription || '')
  const [amount, setAmount] = useState(displayAmount.toString())
  const [date, setDate] = useState<Date | undefined>(txDate)
  const [time, setTime] = useState(format(txDate, 'HH:mm:ss'))
  const [refunded, setRefunded] = useState(transaction?.refunded || false)
  const [selectedCategoryId, setSelectedCategoryId] = useState(transaction?.categoryId?._id || '')
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  if (!transaction) return null

  const handleSave = async () => {
    try {
      if (!date) return

      const [hours, minutes, seconds] = time.split(':').map(Number)
      const combinedDateTime = new Date(date)
      combinedDateTime.setHours(hours || 0, minutes || 0, seconds || 0)

      const parsedAmount = parseFloat(amount)
      const isCredit = parsedAmount < 0
      const absoluteAmount = Math.abs(parsedAmount)

      await updateTransaction({
        id: transaction._id,
        newDescription: description,
        newAmount: absoluteAmount,
        newDate: combinedDateTime.toISOString(),
        type: isCredit ? 'credit' : 'debit',
        refunded,
        categoryId: selectedCategoryId || null,
      }).unwrap()

      toast.success('Transaction updated successfully')
      onClose()
    } catch {
      toast.error('Failed to update transaction')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTransaction(transaction._id).unwrap()
      toast.success('Transaction deleted successfully')
      onClose()
    } catch {
      toast.error('Failed to delete transaction')
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[95vh] bg-[#F8F8F8] dark:bg-zinc-950">
        <DrawerHeader className="relative flex items-center justify-center border-b border-border/50 pb-4 bg-white dark:bg-zinc-900 rounded-t-[inherit]">
          <DrawerTitle className="text-lg font-black uppercase tracking-tight">Edit Transaction</DrawerTitle>
          <button onClick={handleDelete} disabled={isDeleting} className="absolute right-6 p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors disabled:opacity-50">
            <Trash2 className="h-5 w-5" />
          </button>
        </DrawerHeader>

        <div className="p-4 space-y-6 overflow-y-auto">
          {/* DATE Section */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Date</p>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border/40 overflow-hidden">
              <div className="p-4 border-b border-border/40">
                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tight mb-1">Original Date</p>
                <p className="text-sm font-bold text-foreground">{format(new Date(transaction.originalDate), "dd MMM yyyy 'at' h:mm a")}</p>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tight">New Date</p>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-3 flex-1">
                    <Label htmlFor="date-picker" className="px-1 text-[10px] font-black text-muted-foreground/40 uppercase">
                      Date
                    </Label>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" id="date-picker" className="w-full justify-between font-bold bg-secondary/30 border-none rounded-xl h-11 px-4">
                          {date ? format(date, 'dd MMM yyyy') : 'Select date'}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          captionLayout="dropdown"
                          className="w-full border-none"
                          onSelect={(newDate) => {
                            setDate(newDate)
                            setIsCalendarOpen(false)
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="time-picker" className="px-1 text-[10px] font-black text-muted-foreground/40 uppercase">
                      Time
                    </Label>
                    <Input
                      type="time"
                      id="time-picker"
                      step="1"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-32 bg-secondary/30 border-none rounded-xl h-11 font-bold text-sm appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none px-4"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DESCRIPTION Section */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Description</p>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border/40 overflow-hidden">
              <div className="p-4 border-b border-border/40">
                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tight mb-1">Original Description</p>
                <p className="text-sm font-bold text-foreground leading-snug truncate">{transaction.originalDescription}</p>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tight">New Description</p>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter custom description"
                  className="w-full bg-transparent border-none p-0 h-auto font-bold text-sm focus-visible:outline-none placeholder:text-muted-foreground/30"
                />
              </div>
            </div>
          </div>

          {/* AMOUNT Section */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Amount</p>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border/40 overflow-hidden">
              <div className="p-4 border-b border-border/40">
                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tight mb-1">Original Amount</p>
                <p className="text-sm font-bold text-foreground">{transaction.originalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tight mb-2">New Amount</p>
                <AmountInput value={amount} onChange={(val) => setAmount(val || '')} placeholder="Enter custom amount" />
              </div>
            </div>
          </div>

          {/* REFUNDED Section */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Refunded</p>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 flex items-center justify-between border border-border/40">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-foreground">Refunded/Reversed</p>
                <p className="text-[10px] font-medium text-muted-foreground/60 leading-relaxed max-w-[240px]">
                  Marking this transaction as refunded/reversed will prevent it from appearing in any chart or calculations.
                </p>
              </div>
              <Switch checked={refunded} onCheckedChange={setRefunded} />
            </div>
          </div>

          {/* CATEGORIES Section */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Categories</p>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border/40 divide-y divide-border/40">
              {categories?.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategoryId(cat._id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-secondary/10 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl" style={{ color: cat.color }}>
                      {cat.emoji}
                    </span>
                    <span className="text-sm font-black uppercase tracking-tight" style={{ color: cat.color }}>
                      {cat.name}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all',
                      selectedCategoryId === cat._id ? 'border-primary bg-primary' : 'border-zinc-200 dark:border-zinc-800',
                    )}
                  >
                    {selectedCategoryId === cat._id && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 grid grid-cols-2 gap-3 bg-white dark:bg-zinc-900 border-t border-border/50">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-2xl h-14 bg-secondary/20 dark:bg-zinc-800 border-none font-black text-sm uppercase tracking-tight shadow-sm active:scale-95 transition-all"
          >
            Cancel
          </Button>
          <Button
            disabled={isUpdating}
            onClick={handleSave}
            className="rounded-2xl h-14 bg-linear-to-r from-orange-500 to-rose-500 hover:opacity-90 text-white font-black text-sm uppercase tracking-tight shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
          >
            {isUpdating ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
