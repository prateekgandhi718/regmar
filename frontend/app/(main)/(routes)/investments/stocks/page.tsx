'use client'

import { useGetMyInvestmentsQuery } from '@/redux/api/investmentsApi'
import { Loader2 } from 'lucide-react'
import { InvestmentCard } from '../_components/InvestmentCard'
import { StatementPeriod } from '../_components/StatementPeriod'
import { formatCurrency } from '@/lib/utils'
import { getStockLogo } from '@/lib/logos'

export default function StocksPage() {
  const { data, isLoading } = useGetMyInvestmentsQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data?.stocks?.length) return null

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 pb-24">
      <div className="space-y-1">
        <h1 className="text-xl font-black tracking-tight text-primary dark:text-white">Stocks</h1>
        <StatementPeriod period={data.statementPeriod} />
      </div>

      <div className="space-y-4">
        {data.stocks.map((stock) => (
          <InvestmentCard
            key={stock.isin}
            title={stock.name || stock.isin}
            logoUrl={getStockLogo(stock.isin)}
            logoAlt={stock.name}
            rows={[
              { label: 'Quantity', value: stock.freeBalance.toString() },
              { label: 'Market Price', value: formatCurrency(stock.marketPrice) },
              { label: 'Current Value', value: formatCurrency(stock.currentValue), highlight: true },
              { label: 'ISIN', value: stock.isin },
            ]}
          />
        ))}
      </div>
    </div>
  )
}
