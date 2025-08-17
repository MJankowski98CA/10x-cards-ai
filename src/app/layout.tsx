import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { GeistSans } from 'geist/font/sans'

export const metadata: Metadata = {
  title: 'Flashcards AI',
  description: 'AI-powered flashcard generation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>
        <main className="min-h-screen">{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
