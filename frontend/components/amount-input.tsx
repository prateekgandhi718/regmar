import CurrencyInput from 'react-currency-input-field'
import { Info, MinusCircle, PlusCircle } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type AmountInputProps = {
  value: string
  onChange: (value: string | undefined) => void
  placeholder?: string
  disabled?: boolean
}

export const AmountInput = ({ value, onChange, placeholder, disabled }: AmountInputProps) => {
  const parsedValue = parseFloat(value)
  const isCredited = parsedValue < 0
  const isDebited = parsedValue > 0

  const onReverseValue = () => {
    if (!value) {
      return
    }

    const reversedValue = parseFloat(value) * -1
    onChange(reversedValue.toString())
  }

  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onReverseValue}
              className={cn(
                'absolute left-3 top-2 flex items-center justify-center rounded-lg bg-slate-400 p-1.5 transition hover:bg-slate-500',
                isCredited && 'bg-emerald-500 hover:bg-emerald-600',
                isDebited && 'bg-primary hover:bg-primary/90',
              )}
            >
              {!parsedValue && <Info className="size-4 text-white" />}
              {isCredited && <MinusCircle className="size-4 text-white" />}
              {isDebited && <PlusCircle className="size-4 text-white" />}
            </button>
          </TooltipTrigger>

          <TooltipContent>Use [-] for credited and normal for debited</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <CurrencyInput
        className="flex h-12 w-full rounded-2xl border-none bg-secondary/30 px-4 py-2 pl-12 font-bold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
        placeholder={placeholder}
        value={value}
        decimalScale={2}
        decimalsLimit={2}
        onValueChange={onChange}
        disabled={disabled}
      />

      <p className="mt-2 text-[10px] font-black uppercase tracking-tight text-muted-foreground">
        {isCredited && 'This will count as credited (income).'}
        {isDebited && 'This will count as debited (expense).'}
      </p>
    </div>
  )
}

