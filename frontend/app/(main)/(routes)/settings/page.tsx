'use client'

import { useState } from 'react'
import { ChevronRight, Mail, Lock, ExternalLink, ArrowLeft, Loader2, User, Moon, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModeToggle } from '@/components/mode-toggle'
import { useGetLinkedAccountsQuery, useLinkGmailAccountMutation, useUnlinkAccountMutation } from '@/redux/api/linkedAccountsApi'
import { useSelector, useDispatch } from 'react-redux'
import { selectCurrentUser, logout } from '@/redux/features/authSlice'
import { cn } from '@/lib/utils'

const providers = [
  { id: 'gmail', name: 'Gmail', icon: Mail, color: 'text-rose-500', enabled: true },
  { id: 'yahoo', name: 'Yahoo', icon: Mail, color: 'text-purple-600', enabled: false },
  { id: 'icloud', name: 'iCloud', icon: Mail, color: 'text-blue-400', enabled: false },
  { id: 'custom', name: 'Custom', icon: Mail, color: 'text-orange-500', enabled: false },
]

const SettingsPage = () => {
  const [step, setStep] = useState<'selection' | 'gmail-form'>('selection')
  const [email, setEmail] = useState('')
  const [appPassword, setAppPassword] = useState('')

  const user = useSelector(selectCurrentUser)
  const dispatch = useDispatch()

  const { data: linkedAccounts } = useGetLinkedAccountsQuery()
  const [linkGmail, { isLoading: isLinking }] = useLinkGmailAccountMutation()
  const [unlinkAccount, { isLoading: isUnlinking }] = useUnlinkAccountMutation()

  const activeGmail = linkedAccounts?.find((acc) => acc.provider === 'gmail' && acc.isActive)

  const handleLink = async () => {
    if (!email || !appPassword) return
    try {
      await linkGmail({ email, appPassword }).unwrap()
      setStep('selection')
      setEmail('')
      setAppPassword('')
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
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setStep('selection')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-black tracking-tight text-primary dark:text-white">Gmail Setup</h1>
        </div>

        <div className="bg-card dark:bg-[#111111] border border-border dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden group shadow-sm">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-rose-50 dark:bg-rose-500/10 p-6 rounded-4xl">
                <Mail className="h-12 w-12 text-rose-500" />
              </div>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Google Account Integration</p>
          </div>

          <div className="space-y-4">
            <div className="bg-secondary/30 dark:bg-white/5 rounded-3xl border border-border dark:border-white/5 overflow-hidden">
              <div className="flex items-center px-6 h-16 border-b border-border dark:border-white/5">
                <Mail className="h-5 w-5 text-muted-foreground mr-4" />
                <Label className="w-16 text-sm font-bold text-muted-foreground uppercase tracking-wider">Email</Label>
                <Input
                  placeholder="enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-none focus-visible:ring-0 text-right bg-transparent flex-1 h-full font-black text-lg"
                />
              </div>
              <div className="flex items-center px-6 h-16">
                <Lock className="h-5 w-5 text-muted-foreground mr-4" />
                <Label className="w-20 text-sm font-bold text-muted-foreground uppercase tracking-wider">Password</Label>
                <Input
                  type="password"
                  placeholder="enter app password"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  className="border-none focus-visible:ring-0 text-right bg-transparent flex-1 h-full font-black text-lg"
                />
              </div>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-widest px-4 leading-relaxed">An app-specific password is required for secure synchronization.</p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-500/5 rounded-3xl p-6 space-y-6 border-2 border-orange-100 dark:border-orange-500/10">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-orange-600 dark:text-orange-400 font-black uppercase tracking-wider hover:bg-orange-100 dark:hover:bg-orange-500/10 rounded-2xl h-12 px-4 transition-all"
              asChild
            >
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">
                Generate App Password
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>

            <div className="space-y-4 text-xs font-medium text-orange-800/80 dark:text-orange-300/80 leading-relaxed">
              <p>
                <span className="font-black text-orange-600 dark:text-orange-400">01.</span> Sign-in to your Google Account through the button above.
              </p>
              <p>
                <span className="font-black text-orange-600 dark:text-orange-400">02.</span> In <span className="italic">App passwords</span>, name it{' '}
                <span className="font-black text-orange-600 dark:text-orange-400">Regmar</span> and tap Create.
              </p>
              <p>
                <span className="font-black text-orange-600 dark:text-orange-400">03.</span> Copy the 16-character code and paste it in the field above.
              </p>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <Button
              className="flex-1 h-16 rounded-3xl font-black uppercase tracking-widest bg-linear-to-r from-orange-500 to-rose-500 text-white shadow-xl shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
              onClick={handleLink}
              disabled={isLinking || !email || !appPassword}
            >
              {isLinking ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Link Gmail'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-12 pb-24">
      <div className="space-y-2 px-1">
        <p className="text-muted-foreground font-medium">Manage your preferences</p>
        <h1 className="text-3xl font-black tracking-tight text-primary dark:text-white">Settings</h1>
      </div>

      {/* Account Widget */}
      <div className="space-y-6">
        <h2 className="text-xl font-black tracking-tight px-1 flex items-center gap-2 text-primary dark:text-white">
          <User className="h-5 w-5" />
          Account
        </h2>
        <div className="bg-card dark:bg-[#111111] border border-border dark:border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform text-primary dark:text-white">
            <User className="h-32 w-32" />
          </div>

          <div className="flex items-center gap-6 relative z-10 min-w-0">
            <div className="space-y-1 min-w-0">
              <p className="text-2xl font-black tracking-tight text-primary dark:text-white truncate">{user?.name || 'Member'}</p>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest truncate">{user?.email}</p>
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

      {/* Email Integration Widget */}
      <div className="space-y-6">
        <h2 className="text-xl font-black tracking-tight px-1 flex items-center gap-2 text-primary dark:text-white">
          <Mail className="h-5 w-5" />
          Email Sync
        </h2>
        <div className="bg-card dark:bg-[#111111] border border-border dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
          {activeGmail ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-emerald-50 dark:bg-emerald-500/5 rounded-3xl border border-emerald-100 dark:border-emerald-500/10 overflow-hidden">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="bg-white dark:bg-white/10 p-3 rounded-2xl shadow-sm border border-emerald-100/20 shrink-0">
                    <Mail className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest text-[10px] mb-1 truncate">Active Sync</p>
                    <p className="text-lg font-black tracking-tight text-primary dark:text-white truncate">{activeGmail.email}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => setStep('gmail-form')} className="h-14 rounded-2xl font-bold bg-secondary dark:bg-white/5 border-none text-primary dark:text-white">
                  Edit Credentials
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleUnlink(activeGmail.id)}
                  disabled={isUnlinking}
                  className="h-14 rounded-2xl font-bold bg-rose-50 dark:bg-rose-500/5 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/10 border border-rose-100/20 dark:border-rose-500/10"
                >
                  {isUnlinking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Unlink Gmail'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-muted-foreground font-medium px-1 text-lg">Connect your email account to automatically track your statements and financial activity.</p>

              <div className="grid grid-cols-1 gap-3">
                {providers.map((provider) => (
                  <Button
                    key={provider.id}
                    variant="outline"
                    className={cn(
                      'h-20 justify-between px-6 rounded-3xl border-border dark:border-white/5 bg-secondary/30 dark:bg-white/5 hover:bg-secondary/50 dark:hover:bg-white/10 transition-all disabled:opacity-30 disabled:grayscale',
                      provider.enabled && 'hover:scale-[1.02] active:scale-[0.98]',
                    )}
                    disabled={!provider.enabled}
                    onClick={() => provider.id === 'gmail' && setStep('gmail-form')}
                  >
                    <div className="flex items-center gap-5">
                      <div className="bg-white dark:bg-white/10 p-3 rounded-2xl shadow-sm border border-border dark:border-white/5">
                        <provider.icon className={cn('h-6 w-6', provider.color)} />
                      </div>
                      <div className="text-left">
                        <span className="font-black text-xl tracking-tight block text-primary dark:text-white">{provider.name}</span>
                        {!provider.enabled && <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Coming Soon</span>}
                      </div>
                    </div>
                    {provider.enabled && <ChevronRight className="h-6 w-6 text-muted-foreground" />}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
