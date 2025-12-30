'use client'

import { useAppSelector } from '@/redux/hooks'
import { selectCurrentUser } from '@/redux/features/authSlice'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Spinner } from '@/components/spinner'
import BottomNavbar from '@/components/bottom-navbar'

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const user = useAppSelector(selectCurrentUser)
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted && !user) {
      router.push('/')
    }
  }, [user, router, isMounted])

  if (!isMounted || !user) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-full dark:bg-dark-bg">
      <main className="h-full pb-16">{children}</main>
      <BottomNavbar />
    </div>
  )
}

export default MainLayout
