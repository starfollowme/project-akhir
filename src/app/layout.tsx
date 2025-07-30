import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { Header } from '@/components/layout/Header'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'E-Shop - Your Online Store',
  description: 'Modern e-commerce platform built with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            <Header />
            <main>{children}</main>
            <Toaster 
              position="top-right"
              richColors
              closeButton
            />
          </div>
        </Providers>
      </body>
    </html>
  )
}
