import { Transaction } from '@/redux/api/transactionsApi'

export const isInvestment = (tx: Transaction) => tx.categoryId?.name?.toLowerCase() === 'investment'
export const isSelfTransfer = (tx: Transaction) => tx.categoryId?.name?.toLowerCase() === 'self transfer'
export const isExpense = (tx: Transaction) => {
  if (tx.type !== 'debit') return false
  if (tx.refunded) return false
  if (isInvestment(tx)) return false
  if (isSelfTransfer(tx)) return false
  return true
}

export const getTransactionAmount = (tx: Transaction) => tx.newAmount || tx.originalAmount

export const calculateTotals = (transactions: Transaction[]) => {
  let totalExpenses = 0
  let totalInvestments = 0

  transactions.forEach((tx) => {
    if (tx.refunded) return

    const amount = getTransactionAmount(tx)
    if (isInvestment(tx)) {
      totalInvestments += amount
    } else if (isExpense(tx)) {
      totalExpenses += amount
    }
  })

  return { totalExpenses, totalInvestments }
}

