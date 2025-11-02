import type { Metadata } from 'next'
import '@/styles/globals.css'
import { CartProvider } from '@/contexts/CartContext'

export const metadata: Metadata = {
  title: 'SFT | Fashion Brand',
  description: 'Elevate Your Style with SFT',
  icons: {
    icon: '/icon.jpeg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  )
}
