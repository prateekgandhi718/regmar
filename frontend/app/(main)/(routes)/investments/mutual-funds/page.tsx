'use client'

import { useGetMyInvestmentsQuery } from '@/redux/api/investmentsApi'
import { Loader2 } from 'lucide-react'
import { StatementPeriod } from '../_components/StatementPeriod'
import { InvestmentCard } from '../_components/InvestmentCard'
import { formatCurrency } from '@/lib/utils'
import { getMutualFundLogo } from '@/lib/logos'


export default function MutualFundsPage() {
  const { data, isLoading } = useGetMyInvestmentsQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data?.mutualFunds?.length) return null

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 pb-24">
      <div className="space-y-1">
        <h1 className="text-xl font-black tracking-tight text-primary dark:text-white">
          Mutual Funds
        </h1>
        <StatementPeriod period={data.statementPeriod} />
      </div>

      <div className="space-y-4">
        {data.mutualFunds.map((mf) => (
          <InvestmentCard
            key={mf.isin}
            title={mf.name}
            logoUrl={getMutualFundLogo(mf.amc)}
            logoAlt={mf.amc}
            rows={[
              { label: 'Invested', value: formatCurrency(mf.investedValue) },
              { label: 'Current', value: formatCurrency(mf.currentValue), highlight: true },
              { label: 'Units', value: mf.units.toFixed(3) },
              { label: 'NAV', value: formatCurrency(mf.nav) },
              { label: 'P&L', value: formatCurrency(mf.unrealizedPnL) },
              { label: 'P&L %', value: `${mf.unrealizedPnLPercentage.toFixed(2)}%` },
            ]}
          />
        ))}
      </div>
    </div>
  )
}
