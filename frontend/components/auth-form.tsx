'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRequestOtpMutation, useVerifyOtpMutation } from '@/redux/api/authApi'
import { useAppDispatch } from '@/redux/hooks'
import { setCredentials } from '@/redux/features/authSlice'
import { Spinner } from '@/components/spinner'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export const AuthForm = ({ mode }: AuthFormProps) => {
  const router = useRouter()
  const dispatch = useAppDispatch()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [error, setError] = useState('')

  const [requestOtp, { isLoading: isRequesting }] = useRequestOtpMutation()
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation()

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await requestOtp({ email, mode }).unwrap()
      setStep('otp')
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string }; status?: number }
      setError(errorData.data?.message || 'Failed to send OTP')
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const result = await verifyOtp({
        email,
        otp,
        ...(mode === 'signup' ? { name } : {}),
      }).unwrap()

      dispatch(setCredentials(result))
      router.push('/')
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } }
      setError(errorData.data?.message || 'Invalid OTP')
    }
  }

  if (step === 'email') {
    return (
      <div className="w-full max-w-[400px] px-4 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl md:text-3xl font-bold">{mode === 'signup' ? 'Create an account' : 'Welcome back'}</h1>
          <p className="text-muted-foreground text-sm md:text-base">{mode === 'signup' ? 'Enter your details to get started' : 'Enter your email to sign in'}</p>
        </div>
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="bg-transparent" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-transparent" />
            </div>
            {error && (
              <div className="text-center space-y-2">
                <p className="text-destructive text-sm">{error}</p>
                {error.includes('not found') && (
                  <Link href="/signup" className="text-primary hover:underline text-sm block">
                    Create an account instead
                  </Link>
                )}
                {error.includes('already exists') && (
                  <Link href="/login" className="text-primary hover:underline text-sm block">
                    Log in instead
                  </Link>
                )}
              </div>
            )}
          </div>
          <Button type="submit" className="w-full py-6 text-base" disabled={isRequesting}>
            {isRequesting && <Spinner size="default" className="mr-2" />}
            Continue
          </Button>
        </form>
        <div className="text-center">
          <Link href={mode === 'signup' ? '/login' : '/signup'} className="text-sm text-muted-foreground hover:text-primary transition">
            {mode === 'signup' ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[400px] px-4 space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl md:text-3xl font-bold">Check your email</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          We&apos;ve sent a temporary login code to <br />
          <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input id="otp" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} required className="bg-transparent text-center text-lg tracking-widest" maxLength={6} />
          </div>
          {error && <p className="text-destructive text-sm text-center">{error}</p>}
        </div>
        <div className="flex flex-col space-y-3">
          <Button type="submit" className="w-full py-6 text-base" disabled={isVerifying}>
            {isVerifying && <Spinner size="default" className="mr-2" />}
            Verify & Continue
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('email')}>
            Back to email
          </Button>
        </div>
      </form>
    </div>
  )
}
