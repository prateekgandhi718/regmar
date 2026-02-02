import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface InvestmentCardRow {
  label: string
  value: string
  highlight?: boolean
  optimizedValue?: string
}

interface InvestmentCardProps {
  title: string
  rows: InvestmentCardRow[]
  logoUrl?: string
  logoAlt?: string
}

export const InvestmentCard = ({ title, rows, logoUrl, logoAlt }: InvestmentCardProps) => {
  return (
    <Card className="rounded-3xl bg-card dark:bg-[#111111] border border-border dark:border-white/5 p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        {logoUrl && (
          <div className="h-6 w-6 rounded-4xl bg-muted/40 flex items-center justify-center overflow-hidden">
            <Image
              src={logoUrl}
              alt={logoAlt || title}
              width={24}
              height={24}
              className="object-contain"
              onError={(e) => {
                e.currentTarget.src = '/icons/default-asset.svg'
              }}
            />
          </div>
        )}

        <h3 className="text-sm font-black tracking-tight text-primary leading-tight">{title}</h3>
      </div>

      {/* Rows */}
      <div className="grid grid-cols-2 gap-y-3">
        {rows.map((row, idx) => (
          <div key={idx} className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{row.label}</span>
            <div className="flex items-baseline gap-2">
              <span className={cn('text-sm font-black', row.highlight ? 'text-primary' : 'text-muted-foreground')}>{row.value}</span>
              {row.optimizedValue && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 rounded-md">→ {row.optimizedValue}</span>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
