'use client'

import { cn } from '@/lib/utils'
import Logo from './logo'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useScrollTop } from '@/hooks/use-scroll-top'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { logout, selectCurrentUser } from '@/redux/features/authSlice'
import { useEffect, useState } from 'react'

const Navbar = () => {
  const scrolled = useScrollTop()
  const user = useAppSelector(selectCurrentUser)
  const dispatch = useAppDispatch()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn('z-50 bg-background dark:bg-dark-bg fixed top-0 flex items-center w-full p-6', scrolled && 'border-b shadow-sm')}>
        <Link href="/">
          <Logo />
        </Link>
        <div className="md:ml-auto md:justify-end justify-between w-full flex items-center gap-x-2">
          <div className="h-8 w-20" /> {/* Placeholder for buttons */}
          <ModeToggle />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('z-50 bg-background dark:bg-dark-bg fixed top-0 flex items-center w-full p-6', scrolled && 'border-b shadow-sm')}>
      <Link href="/">
        <Logo />
      </Link>
      <div className="md:ml-auto md:justify-end justify-between w-full flex items-center gap-x-2">
        {user ? (
          <>
            <span className="text-sm font-medium mr-2">Hi, {user.name || user.email.split('@')[0]}</span>
            <Button variant="ghost" size="sm" onClick={() => dispatch(logout())}>
              Log out
            </Button>
          </>
        ) : (
          <>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/signup">Get Started</Link>
        </Button>
          </>
        )}
        <ModeToggle />
      </div>
    </div>
  )
}

export default Navbar
