'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'

export default function Navbar() {
  const { getTotalItems } = useCart()
  const cartCount = getTotalItems()

  return (
    <header className="sticky top-0 z-50 bg-brand-primary shadow-lg">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/assets/images/logo-sft.jpeg"
              alt="SFT Logo"
              width={80}
              height={80}
              className="h-12 w-auto"
            />
          </Link>

          {/* Navigation menu - always visible */}
          <ul className="flex gap-3 md:gap-8">
            <li>
              <Link
                href="/"
                className="text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-xs md:text-sm"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/explore"
                className="text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-xs md:text-sm"
              >
                Browse
              </Link>
            </li>
            <li>
              <Link
                href="/order"
                className="text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-xs md:text-sm inline-flex items-center gap-1 md:gap-2"
              >
                Cart
                {cartCount > 0 && (
                  <span className="bg-brand-secondary text-brand-primary text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}
