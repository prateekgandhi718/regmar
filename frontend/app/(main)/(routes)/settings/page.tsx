'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Mail, ExternalLink, ArrowLeft, Loader2, User, Moon, LogOut, MailCheckIcon, Cloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModeToggle } from '@/components/mode-toggle'
import { LinkedAccountProvider, useGetLinkedAccountsQuery, useLinkEmailAccountMutation, useUnlinkAccountMutation } from '@/redux/api/linkedAccountsApi'
import { useSelector, useDispatch } from 'react-redux'
import { selectCurrentUser, logout, updateUser } from '@/redux/features/authSlice'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useUpdatePreferencesMutation } from '@/redux/api/authApi'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'

type ProviderConfig = {
  id: LinkedAccountProvider
  name: string
  icon: typeof Mail
  color: string
  emailPlaceholder: string
  appPasswordUrl: string
  appPasswordSource: string
  steps: string[]
}

const providers: ProviderConfig[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: Mail,
    color: 'text-rose-500',
    emailPlaceholder: 'name@gmail.com',
    appPasswordUrl: 'https://myaccount.google.com/apppasswords',
    appPasswordSource: 'Google',
    steps: [
      'Sign in to your Google account.',
      'Create an app password for FIY (you can name it anything).',
      'Paste the 16-character code here.',
    ],
  },
  {
    id: 'icloud',
    name: 'iCloud',
    icon: Cloud,
    color: 'text-sky-500',
    emailPlaceholder: 'name@icloud.com',
    appPasswordUrl: 'https://appleid.apple.com/account/manage',
    appPasswordSource: 'Apple ID',
    steps: [
      'Sign in to your Apple ID account.',
      'Open the App-Specific Passwords section and generate a new password.',
      'Name it for FIY (or anything), copy the 16-character code, and paste it here.',
    ],
  },
]

const SettingsPage = () => {
  const [step, setStep] = useState<'selection' | 'provider-form'>('selection')
  const [selectedProvider, setSelectedProvider] = useState<LinkedAccountProvider>('gmail')
  const [email, setEmail] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [isPasswordPrefilled, setIsPasswordPrefilled] = useState(false)
  const [initialEmail, setInitialEmail] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)

  const user = useSelector(selectCurrentUser)
  const dispatch = useDispatch()

  const { data: linkedAccounts } = useGetLinkedAccountsQuery()
  const [linkEmail, { isLoading: isLinking }] = useLinkEmailAccountMutation()
  const [unlinkAccount, { isLoading: isUnlinking }] = useUnlinkAccountMutation()
  const [updatePreferences, { isLoading: isUpdatingPreferences }] = useUpdatePreferencesMutation()

  const defaultPrimary = '#f97316'
  const [primaryColor, setPrimaryColor] = useState(user?.primaryColor || defaultPrimary)

  useEffect(() => {
    setPrimaryColor(user?.primaryColor || defaultPrimary)
  }, [user?.primaryColor])

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)')
    const update = () => setIsMobile(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  const primaryPresets = useMemo(
    () => [
      { name: 'Orange', value: '#f97316' },
      { name: 'Blue', value: '#3b82f6' },
      { name: 'Amber', value: '#f59e0b' },
      { name: 'Violet', value: '#8b5cf6' },
      { name: 'Rose', value: '#f43f5e' },
    ],
    [],
  )

  const isPrimaryValid = /^#[0-9a-fA-F]{6}$/.test(primaryColor)
  const isPrimaryDirty = primaryColor !== (user?.primaryColor || defaultPrimary)

  const savePrimaryColor = async () => {
    if (!isPrimaryValid || !isPrimaryDirty) return
    try {
      const updated = await updatePreferences({ primaryColor }).unwrap()
      dispatch(updateUser({ primaryColor: updated.primaryColor }))
      toast.success('Primary color updated')
      setColorPickerOpen(false)
    } catch (error) {
      const apiError = error as { data?: { message?: string } }
      toast.error(apiError?.data?.message || 'Could not update primary color')
    }
  }

  const linkedEmailAccount = linkedAccounts?.find((acc) => acc.isActive)
  const activeProvider = linkedEmailAccount?.provider === 'icloud' ? 'icloud' : 'gmail'
  const selectedProviderConfig = providers.find((provider) => provider.id === selectedProvider) ?? providers[0]

  const maskedPassword = '*'.repeat(16)
  const isEditing = Boolean(linkedEmailAccount)
  const isEmailChanged = email.trim() !== initialEmail.trim()
  const isPasswordChanged = !isPasswordPrefilled
  const isPasswordValid = appPassword.length === 16
  const isPasswordRequired = !isEditing || isPasswordChanged || isEmailChanged
  const isSaveDisabled =
    isLinking ||
    !email ||
    (isEditing && !isEmailChanged && !isPasswordChanged) ||
    (isPasswordRequired && !isPasswordValid)

  const PrimaryColorPickerBody = (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        {primaryPresets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => setPrimaryColor(preset.value)}
            className={cn(
              'h-10 w-full rounded-xl border transition-all',
              primaryColor.toLowerCase() === preset.value.toLowerCase()
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-border/60 hover:border-border',
            )}
            style={{ backgroundColor: preset.value }}
            title={preset.name}
            aria-label={preset.name}
          />
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="primaryColorHex">Custom hex</Label>
        <div className="flex items-center gap-2">
          <div
            className="h-10 w-10 rounded-xl border border-border/60"
            style={{ backgroundColor: isPrimaryValid ? primaryColor : 'transparent' }}
          />
          <Input
            id="primaryColorHex"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value.trim())}
            placeholder="#f97316"
            className="font-mono"
          />
        </div>
        {!isPrimaryValid && <p className="text-xs text-muted-foreground">Enter a valid hex color like #1a2b3c.</p>}
      </div>

      <Button
        className="w-full rounded-xl font-bold"
        disabled={isUpdatingPreferences || !isPrimaryValid || !isPrimaryDirty}
        onClick={savePrimaryColor}
      >
        Save
      </Button>
    </div>
  )

  const handleLink = async () => {
    const shouldSendPassword = !isPasswordPrefilled || isEmailChanged
    if (!email) return
    if (shouldSendPassword && appPassword.length !== 16) return
    try {
      const response = await linkEmail({ provider: selectedProvider, email, appPassword: shouldSendPassword ? appPassword : '' }).unwrap()
      toast.success(response.message || 'Email account connected')
      setStep('selection')
      setSelectedProvider('gmail')
      setEmail('')
      setAppPassword('')
      setIsPasswordPrefilled(false)
      setInitialEmail('')
    } catch (error) {
      const apiError = error as { data?: { message?: string } }
      toast.error(apiError?.data?.message || 'Could not connect. Please check your app password.')
      console.error('Failed to link email account:', error)
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

  if (step === 'provider-form') {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-8 pb-24">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => {
              setStep('selection')
              setSelectedProvider('gmail')
              setEmail('')
              setAppPassword('')
              setIsPasswordPrefilled(false)
              setInitialEmail('')
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-black tracking-tight text-primary dark:text-white">Link Email Account</h1>
        </div>

        <div className="bg-card dark:bg-[#111111] border border-border dark:border-white/5 rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{selectedProviderConfig.name}</p>
            <p className="text-sm text-muted-foreground">
              Link the email where you receive banking alerts and statements.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider-email">Email</Label>
                <Input
                  id="provider-email"
                  type="email"
                  placeholder={selectedProviderConfig.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent"
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider-password">App password</Label>
              <Input
                id="provider-password"
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
              <p className="text-xs text-muted-foreground">
                Use a 16-character app-specific password from your {selectedProviderConfig.name} account.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 dark:border-white/5 p-4 space-y-3 bg-secondary/20 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Create App Password</p>
              <Button variant="outline" className="h-7 p-2 rounded-xl" asChild>
                <a href={selectedProviderConfig.appPasswordUrl} target="_blank" rel="noopener noreferrer">
                  Open {selectedProviderConfig.appPasswordSource}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              {selectedProviderConfig.steps.map((stepText, index) => (
                <p key={`${selectedProviderConfig.id}-${index}`}>{index + 1}. {stepText}</p>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 dark:border-white/5 p-4 space-y-4 bg-secondary/20 dark:bg-white/5 text-sm text-foreground/90">
            <p className="font-bold text-base">Why Do I Need an App Password?</p>
            <p>
              FIY uses IMAP to read banking alert emails from your mailbox. An app password gives secure, limited access
              without using your main account password.
            </p>
            <p className="font-semibold">What&apos;s an App Password?</p>
            <p>
              It&apos;s a one-time password generated by your email provider for this app. You can revoke it anytime from provider settings.
            </p>
            <p className="font-semibold">Is It Safe?</p>
            <p>
              Yes. App passwords only grant mailbox access for this connection and do not expose your primary login password.
            </p>
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
          {linkedEmailAccount ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-border dark:border-white/5 p-4 bg-secondary/20 dark:bg-white/5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-background/70 dark:bg-white/5 p-2 rounded-xl border border-border/60 dark:border-white/10">
                    <MailCheckIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-primary dark:text-white truncate">{linkedEmailAccount.email}</p>
                    <p className="text-xs text-muted-foreground">{activeProvider === 'icloud' ? 'iCloud' : 'Gmail'}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">Connected</span>
              </div>

              <div className="flex items-center justify-around gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedProvider(activeProvider)
                    setEmail(linkedEmailAccount.email)
                    setInitialEmail(linkedEmailAccount.email)
                    setAppPassword(maskedPassword)
                    setIsPasswordPrefilled(true)
                    setStep('provider-form')
                  }}
                  className="h-11 rounded-2xl font-semibold"
                >
                  Edit Credentials
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleUnlink(linkedEmailAccount.id)}
                  disabled={isUnlinking}
                  className="h-11 rounded-2xl font-semibold text-primary hover:bg-primary/10"
                >
                  {isUnlinking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Unlink Email'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Link the inbox where you receive banking alerts to automatically fetch statements and transactions.
              </p>

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
                      setSelectedProvider(provider.id)
                      setStep('provider-form')
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
        <div className="bg-card dark:bg-[#111111] border border-border dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
          <div className="flex items-center justify-between gap-6">
            <div className="space-y-1">
              <p className="font-bold text-lg text-primary dark:text-white">Theme</p>
              <p className="text-sm text-muted-foreground font-medium">Switch between light and dark mode</p>
            </div>
            <ModeToggle />
          </div>

          <div className="flex items-center justify-between gap-6">
            <div className="space-y-1">
              <p className="font-bold text-lg text-primary dark:text-white">Primary color</p>
              <p className="text-sm text-muted-foreground font-medium">Choose the accent color used across the app</p>
            </div>

            <div className="flex items-center gap-3">
              {isMobile ? (
                <Drawer open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="outline" className="rounded-2xl gap-2">
                      <span className="h-4 w-4 rounded-md border border-border/60" style={{ backgroundColor: primaryColor }} />
                      <span className="font-mono text-xs">{primaryColor}</span>
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader className="px-6 pt-6">
                      <DrawerTitle className="text-lg font-black">Primary color</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-6 pb-10">{PrimaryColorPickerBody}</div>
                  </DrawerContent>
                </Drawer>
              ) : (
                <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-2xl gap-2">
                      <span className="h-4 w-4 rounded-md border border-border/60" style={{ backgroundColor: primaryColor }} />
                      <span className="font-mono text-xs">{primaryColor}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 rounded-2xl">
                    <div className="mb-3">
                      <p className="font-bold text-sm">Choose a color</p>
                      <p className="text-xs text-muted-foreground">Pick a preset or enter a hex value.</p>
                    </div>
                    {PrimaryColorPickerBody}
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </div>
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
              <p className="font-bold text-lg text-primary dark:text-white truncate">{user?.name || 'Member'}</p>
              <p className="text-sm font-medium text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={() => dispatch(logout())}
            className="w-full h-14 rounded-2xl border border-primary/20 bg-primary/10 text-primary font-black uppercase tracking-widest hover:bg-primary/15 hover:border-primary/30 transition-all active:scale-[0.99]"
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
