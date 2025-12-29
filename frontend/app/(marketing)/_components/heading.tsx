'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useAppSelector } from '@/redux/hooks'
import { selectCurrentUser } from '@/redux/features/authSlice'
import { useEffect, useState } from 'react'
import { Spinner } from '@/components/spinner'

export const Heading = () => {
  const user = useAppSelector(selectCurrentUser)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="max-w-3xl space-y-4">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold">
          Your financial transactions, travel plans and newsletters. Unified. Welcome to <span className="underline">Regmar</span>
        </h1>
        <h3 className="text-base sm:text-xl md:text-2xl font-medium">
          Regmar helps you smooth the information overload <br /> just like sandpaper.
        </h3>
        <div className="w-full flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold">
        Your financial transactions, travel plans and newsletters. Unified. Welcome to <span className="underline">Regmar</span>
      </h1>
      <h3 className="text-base sm:text-xl md:text-2xl font-medium">
        Regmar helps you smooth the information overload <br /> just like sandpaper.
      </h3>
      {user ? (
        <Button asChild>
          <Link href="/documents">
            Enter Regmar
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      ) : (
        <Button asChild>
          <Link href="/signup">
            Get Regmar Free
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      )}
    </div>
  )
}
