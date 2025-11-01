'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-brand-primary shadow-lg">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center" onClick={() => setIsOpen(false)}>
            <Image
              src="/assets/images/logo-sft.jpeg"
              alt="SFT Logo"
              width={80}
              height={80}
              className="h-12 w-auto"
            />
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-brand-light p-2"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Desktop menu */}
          <ul className="hidden md:flex gap-4 md:gap-8">
            <li>
              <Link
                href="/"
                className="text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-sm"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/explore"
                className="text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-sm"
              >
                Catalogue
              </Link>
            </li>
            <li>
              <Link
                href="/stock"
                className="text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-sm"
              >
                Stock
              </Link>
            </li>
            <li>
              <Link
                href="/order"
                className="text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-sm"
              >
                Order
              </Link>
            </li>
            <li>
              <Link
                href="#about"
                className="text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-sm"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="#contact"
                className="text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-sm"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <ul className="flex flex-col gap-4">
              <li>
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="block text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-sm py-2"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/explore"
                  onClick={() => setIsOpen(false)}
                  className="block text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-sm py-2"
                >
                  Catalogue
                </Link>
              </li>
              <li>
                <Link
                  href="/stock"
                  onClick={() => setIsOpen(false)}
                  className="block text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-sm py-2"
                >
                  Stock
                </Link>
              </li>
              <li>
                <Link
                  href="/order"
                  onClick={() => setIsOpen(false)}
                  className="block text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-sm py-2"
                >
                  Place Order
                </Link>
              </li>
              <li>
                <Link
                  href="#about"
                  onClick={() => setIsOpen(false)}
                  className="block text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-sm py-2"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="#contact"
                  onClick={() => setIsOpen(false)}
                  className="block text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-sm py-2"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  )
}
