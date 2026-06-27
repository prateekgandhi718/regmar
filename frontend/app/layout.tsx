import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { StateProvider } from '@/redux/provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { PrimaryColorProvider } from '@/components/providers/primary-color-provider'
import { Toaster } from '@/components/ui/sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'FIY - Automated transactions and investments tracker.',
  description: 'FIY helps you track automated transactions and investments in one place.',
  icons: {
    icon: [{ url: '/logo.svg', type: 'image/svg+xml' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="regmar-app-theme">
          <StateProvider>
            <PrimaryColorProvider>{children}</PrimaryColorProvider>
          </StateProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
