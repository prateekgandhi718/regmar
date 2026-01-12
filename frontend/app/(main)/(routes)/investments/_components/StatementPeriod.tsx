import { Calendar } from 'lucide-react'

interface StatementPeriodProps {
  period?: string
}

export const StatementPeriod = ({ period }: StatementPeriodProps) => {
  if (!period) return null

  return (
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
      Statement period: {period}
    </div>
  )
}
