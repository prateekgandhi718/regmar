'use client'

import { useState } from 'react'
import { ChevronRight, Mail, Lock, ExternalLink, ArrowLeft, Loader2, User, Moon, LogOut, MailCheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModeToggle } from '@/components/mode-toggle'
import { useGetLinkedAccountsQuery, useLinkGmailAccountMutation, useUnlinkAccountMutation } from '@/redux/api/linkedAccountsApi'
import { useSelector, useDispatch } from 'react-redux'
import { selectCurrentUser, logout } from '@/redux/features/authSlice'
import { cn } from '@/lib/utils'

const providers = [{ id: 'gmail', name: 'Gmail', icon: Mail, color: 'text-rose-500', enabled: true }]

const SettingsPage = () => {
  const [step, setStep] = useState<'selection' | 'gmail-form'>('selection')
  const [email, setEmail] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [isPasswordPrefilled, setIsPasswordPrefilled] = useState(false)
  const [initialEmail, setInitialEmail] = useState('')

  const user = useSelector(selectCurrentUser)
  const dispatch = useDispatch()

  const { data: linkedAccounts } = useGetLinkedAccountsQuery()
  const [linkGmail, { isLoading: isLinking }] = useLinkGmailAccountMutation()
  const [unlinkAccount, { isLoading: isUnlinking }] = useUnlinkAccountMutation()

  const activeGmail = linkedAccounts?.find((acc) => acc.provider === 'gmail' && acc.isActive)

  const maskedPassword = '*'.repeat(16)
  const isEditing = Boolean(activeGmail)
  const isEmailChanged = email.trim() !== initialEmail.trim()
  const isPasswordChanged = !isPasswordPrefilled
  const isPasswordValid = appPassword.length === 16
  const isSaveDisabled =
    isLinking ||
    !email ||
    (!isEditing && !isPasswordValid) ||
    (isEditing && !isEmailChanged && !isPasswordChanged) ||
    (isEditing && isPasswordChanged && !isPasswordValid)

  const handleLink = async () => {
    const shouldSendPassword = !isPasswordPrefilled
    if (!email) return
    if (!shouldSendPassword && !isEditing) return
    if (shouldSendPassword && appPassword.length !== 16) return
    try {
      await linkGmail({ email, appPassword: shouldSendPassword ? appPassword : '' }).unwrap()
      setStep('selection')
      setEmail('')
      setAppPassword('')
      setIsPasswordPrefilled(false)
      setInitialEmail('')
    } catch (error) {
      console.error('Failed to link Gmail:', error)
    }
  }

  const handleUnlink = async (id: string) => {
    if (!confirm('Are you sure you want to unlink this account?')) return
    try {
      await unlinkAccount(id).unwrap()
    } catch (error) {
      console.error('Failed to unlink:', error)
    }
  }

  if (step === 'gmail-form') {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-8 pb-24">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => {
              setStep('selection')
              setEmail('')
              setAppPassword('')
              setIsPasswordPrefilled(false)
              setInitialEmail('')
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-black tracking-tight text-primary dark:text-white">Gmail Setup</h1>
        </div>

        <div className="bg-card dark:bg-[#111111] border border-border dark:border-white/5 rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Add your Gmail address and app password to sync transactions.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gmail-email">Email</Label>
                <Input
                  id="gmail-email"
                  type="email"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent"
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gmail-password">App password</Label>
              <Input
                id="gmail-password"
                type="password"
                placeholder="16-character app password"
                value={appPassword}
                onChange={(e) => {
                  const normalized = e.target.value.replace(/\s+/g, '')
                  setAppPassword(normalized.slice(0, 16))
                }}
                onFocus={() => {
                  if (isPasswordPrefilled) {
                    setAppPassword('')
                    setIsPasswordPrefilled(false)
                  }
                }}
                className="bg-transparent"
              />
              <p className="text-xs text-muted-foreground">Use a 16-character app-specific password from your Google account.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 dark:border-white/5 p-4 space-y-3 bg-secondary/20 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Create App Password</p>
              <Button variant="outline" className="h-7 p-2 rounded-xl" asChild>
                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">
                  Open Google
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>1. Sign in to your Google account.</p>
              <p>2. Create an app password named Regmar.</p>
              <p>3. Paste the 16-character code here.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="h-11 rounded-2xl font-bold"
              onClick={handleLink}
              disabled={isSaveDisabled}
            >
              {isLinking ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">Settings</h1>
      </div>

      {/* Email Integration Widget */}
      <div className="space-y-6">
        <h2 className="text-xl font-black tracking-tight px-1 flex items-center gap-2 text-primary dark:text-white">
          <Mail className="h-5 w-5" />
          Email Sync
        </h2>
        <div className="bg-card dark:bg-[#111111] border border-border dark:border-white/5 rounded-3xl p-6 space-y-6 shadow-sm">
          {activeGmail ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-border dark:border-white/5 p-4 bg-secondary/20 dark:bg-white/5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-background/70 dark:bg-white/5 p-2 rounded-xl border border-border/60 dark:border-white/10">
                    <MailCheckIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-primary dark:text-white truncate">{activeGmail.email}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">Connected</span>
              </div>

              <div className="flex items-center justify-around gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmail(activeGmail.email)
                    setInitialEmail(activeGmail.email)
                    setAppPassword(maskedPassword)
                    setIsPasswordPrefilled(true)
                    setStep('gmail-form')
                  }}
                  className="h-11 rounded-2xl font-semibold"
                >
                  Edit Credentials
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleUnlink(activeGmail.id)}
                  disabled={isUnlinking}
                  className="h-11 rounded-2xl font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                >
                  {isUnlinking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Unlink Gmail'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Connect your email account to automatically track your statements.</p>

              <div className="grid grid-cols-1 gap-2">
                {providers.map((provider) => (
                  <Button
                    key={provider.id}
                    variant="outline"
                    className="h-12 justify-between px-4 rounded-2xl border-border dark:border-white/5 bg-transparent hover:bg-secondary/30 dark:hover:bg-white/5 transition-all"
                    onClick={() => {
                      setEmail('')
                      setInitialEmail('')
                      setAppPassword('')
                      setIsPasswordPrefilled(false)
                      setStep('gmail-form')
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <provider.icon className={cn('h-5 w-5', provider.color)} />
                      <span className="font-semibold text-primary dark:text-white">{provider.name}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Appearance Widget */}
      <div className="space-y-6">
        <h2 className="text-xl font-black tracking-tight px-1 flex items-center gap-2 text-primary dark:text-white">
          <Moon className="h-5 w-5" />
          Appearance
        </h2>
        <div className="bg-card dark:bg-[#111111] border border-border dark:border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-bold text-lg text-primary dark:text-white">Theme</p>
            <p className="text-sm text-muted-foreground font-medium">Switch between light and dark mode</p>
          </div>
          <ModeToggle />
        </div>
      </div>

      {/* Account Widget */}
      <div className="space-y-6">
        <h2 className="text-3xl font-black tracking-tight px-1 flex items-center gap-2 text-primary dark:text-white">
          <User className="h-5 w-5" />
          Account
        </h2>
        <div className="bg-card dark:bg-[#111111] border border-border dark:border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform text-primary dark:text-white">
            <User className="h-32 w-32" />
          </div>

          <div className="flex items-center gap-6 relative z-10 min-w-0">
            <div className="space-y-1 min-w-0">
              <p className="font-bold text-lg text-primary dark:text-white truncate">{user?.name || 'Member'}</p>
              <p className="text-sm font-medium text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={() => dispatch(logout())}
            className="w-full h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/5 text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-500/10 transition-all border border-rose-100/50 dark:border-rose-500/10"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
