import { cn } from '@/lib/utils'

export function AppMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-5 w-5 text-primary', className)}
      aria-hidden="true"
    >
      <ellipse cx="50" cy="52" rx="18" ry="16" stroke="currentColor" strokeWidth="7" />
      <path d="M 50 12 V 90" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
    </svg>
  )
}

