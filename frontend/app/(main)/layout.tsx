'use client'

import { useAppSelector } from '@/redux/hooks'
import { selectCurrentUser } from '@/redux/features/authSlice'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Spinner } from '@/components/spinner'

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const user = useAppSelector(selectCurrentUser)
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-full dark:bg-dark-bg">
      <main className="h-full">{children}</main>
    </div>
  )
}

export default MainLayout
