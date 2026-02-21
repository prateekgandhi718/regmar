'use client'

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Transaction, useDeleteTransactionMutation } from '@/redux/api/transactionsApi'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { EditTransactionDrawer } from './edit-transaction-drawer'
import { getLogoUrl } from '@/lib/logos'
import { EmailContentSection } from './email-content-section'

interface TransactionDetailDrawerProps {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
}

export const TransactionDetailDrawer = ({ transaction, isOpen, onClose }: TransactionDetailDrawerProps) => {
  const [deleteTransaction, { isLoading: isDeleting }] = useDeleteTransactionMutation()
  const [isEditOpen, setIsEditOpen] = useState(false)

  if (!transaction) return null

  const deleteTx = async () => {
    try {
      await deleteTransaction(transaction._id).unwrap()
      toast.success('Transaction deleted successfully')
      onClose()
    } catch {
      toast.error('Failed to delete transaction')
    }
  }

  const fromEmail = transaction.accountId?.domainIds?.[0]?.fromEmail
  const domainName = fromEmail.split('@')[1]
  const logoUrl = getLogoUrl(domainName)

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[95vh] bg-[#F8F8F8] dark:bg-zinc-950">
        <DrawerHeader className="relative flex items-center justify-center border-b border-border/50 pb-4 bg-white dark:bg-zinc-900 rounded-t-[inherit]">
          <DrawerTitle className="text-lg font-black uppercase tracking-tight">Transaction</DrawerTitle>
        </DrawerHeader>

        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Main Transaction Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-border/40">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                {transaction.categoryId?.emoji ? (
                  <span className="text-3xl">{transaction.categoryId.emoji}</span>
                ) : (
                  <Image src={logoUrl} alt="Bank Logo" width={40} height={40} className="w-10 h-10 object-contain" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-foreground truncate leading-tight uppercase tracking-tight">{transaction.newDescription || transaction.originalDescription}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-muted-foreground/60">{format(new Date(transaction.newDate || transaction.originalDate), 'dd MMM yyyy')}</span>
                  <span className="text-xs font-bold text-muted-foreground/60">•</span>
                  <span className="text-xs font-bold text-muted-foreground/60 uppercase">{transaction.accountId?.title}</span>
                </div>
              </div>
              <span className={`text-xl font-black ${transaction.type === 'debit' ? 'text-primary' : 'text-emerald-500'}`}>
                ₹{(transaction.newAmount || transaction.originalAmount).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Original Description Section */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Original Description</p>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-border/40">
              <p className="text-sm font-bold text-foreground leading-snug">{transaction.originalDescription}</p>
            </div>
          </div>

          {/* Account Section */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Account</p>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 flex items-center justify-between border border-border/40">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center p-1 overflow-hidden">
                  <Image src={logoUrl} alt="Bank Logo" width={32} height={32} className="w-full h-full object-contain" />
                </div>
                <span className="text-sm font-black uppercase tracking-tight">{transaction.accountId?.title}</span>
              </div>
              <span className="text-xs font-bold text-muted-foreground/60">Bank • x{transaction.accountId?.accountNumber?.slice(-4) || 'XXXX'}</span>
            </div>
          </div>

          {/* Category Section */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Category</p>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-border/40">
              <div className="flex items-center gap-3" style={{ color: transaction.categoryId?.color }}>
                <span className="text-xl">{transaction.categoryId?.emoji || '💰'}</span>
                <span className="text-sm font-black uppercase tracking-tight">{transaction.categoryId?.name || 'Uncategorized'}</span>
              </div>
            </div>
          </div>

          {/* Email content section  */}
          <EmailContentSection emailBody={transaction.emailBody} entities={transaction.entities} transactionId={transaction._id} />
        </div>

        {/* Footer Buttons */}
        <div className="p-4 grid grid-cols-5 gap-3 bg-white dark:bg-zinc-900 border-t border-border/50">
          <Button
            variant="destructive"
            onClick={deleteTx}
            disabled={isDeleting}
            className="col-span-1 rounded-2xl h-12 bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsEditOpen(true)}
            className="col-span-4 rounded-2xl h-12 bg-white dark:bg-zinc-900 font-black text-sm uppercase tracking-tight shadow-sm active:scale-95 transition-all border-border/40"
          >
            Edit
          </Button>
        </div>
      </DrawerContent>

      <EditTransactionDrawer
        key={`${transaction._id}-${transaction.updatedAt}`}
        transaction={transaction}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          onClose() // Close the detail drawer as well when edit is saved/cancelled
        }}
      />
    </Drawer>
  )
}
