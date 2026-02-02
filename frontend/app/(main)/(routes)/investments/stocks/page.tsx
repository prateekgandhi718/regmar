'use client'

import { useGetMyInvestmentsQuery, useOptimizeUltimatePortfolioMutation } from '@/redux/api/investmentsApi'
import { Loader2, RefreshCw, Zap } from 'lucide-react' // Added Zap for optimization icon
import { InvestmentCard, InvestmentCardRow } from '../_components/InvestmentCard'
import { StatementPeriod } from '../_components/StatementPeriod'
import { formatCurrency } from '@/lib/utils'
import { getStockLogo } from '@/lib/logos'
import { Button } from '@/components/ui/button'

export default function StocksPage() {
  const { data, isLoading } = useGetMyInvestmentsQuery()
  const [optimize, { data: optimizedData, isLoading: isOptimizing }] = useOptimizeUltimatePortfolioMutation()

  const handleOptimize = async () => {
    if (!data?.stocks) return
    const tickers = data.stocks.filter(s => !s.isEtf).map(s => s.ticker)
    if (tickers.length === 0) {
      // Optional: Add a toast notification here saying no stocks found to optimize
      return
    }
    await optimize({ tickers }).unwrap()
  }

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
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-black tracking-tight text-primary dark:text-white">
            Stocks
          </h1>
          <StatementPeriod period={data.statementPeriod} />
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="text-[10px] font-black uppercase tracking-widest h-8 rounded-xl bg-secondary/50 text-muted-foreground"
          onClick={handleOptimize}
          disabled={isOptimizing}
        >
          {isOptimizing ? (
            <Loader2 className="h-3 w-3 animate-spin mr-2" />
          ) : (
            <Zap className="h-3 w-3 mr-2 fill-current" />
          )}
          {optimizedData ? 'Re optimize' : 'Optimize Portfolio'}
        </Button>
      </div>

      <div className="space-y-4">
        {data.stocks.map((stock) => {
          const optimizedPerc = optimizedData?.allocations[stock.ticker]
          
          const rows: InvestmentCardRow[] = [
            { label: 'Quantity', value: stock.freeBalance.toString() },
            { label: 'Market Price', value: formatCurrency(stock.marketPrice) },
            {
              label: 'Current Value',
              value: formatCurrency(stock.currentValue),
              highlight: true,
            },
          ]

          if (!stock.isEtf && stock.currentPercentage > 0) {
            rows.push({
              label: 'Allocation',
              value: `${stock.currentPercentage.toFixed(2)}%`,
              // Pass the optimized percentage here if it exists
              optimizedValue: optimizedPerc !== undefined ? `${optimizedPerc.toFixed(2)}%` : undefined
            })
          }

          rows.push({ label: 'ISIN', value: stock.isin })

          return (
            <InvestmentCard
              key={stock.isin}
              title={stock.name || stock.isin}
              logoUrl={getStockLogo(stock.isin)}
              logoAlt={stock.name}
              rows={rows}
            />
          )
        })}
      </div>
    </div>
  )
}