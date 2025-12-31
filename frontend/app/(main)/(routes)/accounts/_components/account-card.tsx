import { MoreVertical } from 'lucide-react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getLogoUrl } from '@/lib/logos'

interface AccountCardProps {
  title: string
  accountNumber?: string
  domainName?: string
  className?: string
  currency?: string
}

export const AccountCard = ({ title, accountNumber, domainName, currency, className }: AccountCardProps) => {
  const extractedDomain = domainName?.split('@').pop()
  const iconUrl = extractedDomain ? getLogoUrl(extractedDomain) : null

  return (
    <Card className={cn('relative w-64 aspect-video rounded-2xl p-4 text-white overflow-hidden border-none shadow-lg shrink-0', 'bg-linear-to-br from-rose-500 via-rose-600 to-rose-800', className)}>
      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <h3 className="font-bold text-lg tracking-wider uppercase leading-none">{title}</h3>
          <p className="text-[10px] opacity-70 uppercase font-semibold">Bank</p>
        </div>
        <button className="p-1 hover:bg-white/10 rounded-full transition-colors -mr-1 -mt-1">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
        <div className="space-y-0.5">
          {accountNumber && <p className="text-[10px] font-black opacity-80 mb-1 tracking-wider">•••• {accountNumber.slice(-4)}</p>}
          <p className="text-[8px] font-bold opacity-60 uppercase tracking-tighter">{currency}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-lg border border-white/20">
          {iconUrl ? (
            <Image src={iconUrl} alt={title} width={16} height={16} className="h-4 w-4 object-contain" />
          ) : (
            <div className="h-4 w-4 flex items-center justify-center text-[8px] font-black text-white">{title.substring(0, 2).toUpperCase()}</div>
          )}
        </div>
      </div>
    </Card>
  )
}
