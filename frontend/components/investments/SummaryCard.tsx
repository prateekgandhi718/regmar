'use client'

import { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
  title: string
  subtitle: string
  value: string
  icon: ReactNode
  iconBgColor: string
  onClick?: () => void
}

export const SummaryCard = ({ 
  title, 
  subtitle, 
  value, 
  icon, 
  iconBgColor,
  onClick 
}: SummaryCardProps) => {
  return (
    <div 
      onClick={onClick}
      className="bg-card dark:bg-[#111111] border border-border dark:border-white/5 rounded-4xl p-6 flex items-center justify-between group cursor-pointer hover:bg-secondary/20 transition-all active:scale-[0.98]"
    >
      <div className="flex items-center gap-5">
        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", iconBgColor)}>
          {icon}
        </div>
        <div>
          <p className="text-base font-black tracking-tight text-primary dark:text-white">{title}</p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-lg font-black text-primary dark:text-white">
          {value}
        </span>
        <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  )
}

