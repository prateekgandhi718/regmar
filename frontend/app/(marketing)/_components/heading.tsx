'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const Heading = () => {
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold">
        Your financial transactions, travel plans and newsletters. Unified. Welcome to <span className="underline">Regmar</span>
      </h1>
      <h3 className="text-base sm:text-xl md:text-2xl font-medium">
        Regmar helps you smooth the information overload <br /> just like sandpaper.
      </h3>
      <Button asChild>
        <Link href="/signup">
          Get Regmar Free
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>
    </div>
  )
}

