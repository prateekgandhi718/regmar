'use client'

import { useGetMyInvestmentsQuery } from '@/redux/api/investmentsApi'
import { Loader2, ArrowLeft } from 'lucide-react'
import { StatementPeriod } from '../_components/StatementPeriod'
import { InvestmentCard } from '../_components/InvestmentCard'
import { formatCurrency } from '@/lib/utils'
import { getMutualFundLogo } from '@/lib/logos'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

const formatSipBadgeAmount = (amount: number) => {
  if (amount >= 999) {
    const inThousands = amount / 1000
    const value = Number.isInteger(inThousands) ? inThousands.toFixed(0) : inThousands.toFixed(1)
    return `${value}k`
  }

  return amount.toFixed(0)
}

const formatCompactSipAmount = (amount: number) => {
  if (amount >= 1000) return `₹${Math.round(amount / 1000)}k`
  return formatCurrency(amount)
}


export default function MutualFundsPage() {
  const router = useRouter()
  const { data, isLoading } = useGetMyInvestmentsQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data?.mutualFunds?.length) return null

  const sipSummary = data.sipSummary || { activeFunds: 0, totalMonthlyAmount: 0 }
  const mutualFunds = [...data.mutualFunds].sort((a, b) => Number(b.sipActive) - Number(a.sipActive))

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 pb-24">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-secondary/40 text-muted-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-xl font-black tracking-tight text-primary dark:text-white">
              Mutual Funds
            </h1>
            <StatementPeriod period={data.statementPeriod} />
          </div>
        </div>
      </div>

      <Card className="rounded-3xl border border-border dark:border-white/5 p-5 bg-card dark:bg-[#111111]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Monthly SIP</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-primary">
              {formatCompactSipAmount(sipSummary.totalMonthlyAmount)}
            </p>
          </div>
          <Badge variant={sipSummary.activeFunds > 0 ? 'default' : 'secondary'}>
            {sipSummary.activeFunds} Active SIP{sipSummary.activeFunds === 1 ? '' : 's'}
          </Badge>
        </div>
      </Card>

      <div className="space-y-4">
        {mutualFunds.map((mf) => (
          <InvestmentCard
            key={mf.isin}
            title={mf.name}
            logoUrl={getMutualFundLogo(mf.amc)}
            logoAlt={mf.amc}
            headerRight={
              <Badge variant={mf.sipActive ? 'default' : 'secondary'}>
                {mf.sipActive ? `${formatSipBadgeAmount(mf.sipMonthlyAmount)}/month` : 'Inactive'}
              </Badge>
            }
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
