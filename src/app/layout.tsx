import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Binance Hot Coins',
  description: 'Real-time cryptocurrency dashboard with live Binance data',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}