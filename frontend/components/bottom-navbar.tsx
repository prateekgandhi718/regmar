'use client'

import { Home, CreditCard, Plane, Settings, Wallet} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const BottomNavbar = () => {
  const pathname = usePathname()


  const tabs = [
    {
      label: 'Home',
      icon: Home,
      href: '/home',
    },
    {
      label: 'Transactions',
      icon: Wallet,
      href: '/transactions',
    },
    {
      label: 'Travels',
      icon: Plane,
      href: '/travels',
    },
    {
      label: 'Accounts',
      icon: CreditCard,
      href: '/accounts',
    },
    {
      label: 'Settings',
      icon: Settings,
      href: '/settings',
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background dark:bg-dark-bg border-t">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-y-1 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default BottomNavbar

