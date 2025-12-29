'use client'

import { cn } from '@/lib/utils'
import Logo from './logo'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useScrollTop } from '@/hooks/use-scroll-top'

const Navbar = () => {
  const scrolled = useScrollTop()

  return (
    <div
      className={cn(
        'z-50 bg-background dark:bg-dark-bg fixed top-0 flex items-center w-full p-6',
        scrolled && 'border-b shadow-sm'
      )}
    >
      <Link href="/">
        <Logo />
      </Link>
      <div className="md:ml-auto md:justify-end justify-between w-full flex items-center gap-x-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/signup">Get Started</Link>
        </Button>
        <ModeToggle />
      </div>
    </div>
  )
}

export default Navbar

