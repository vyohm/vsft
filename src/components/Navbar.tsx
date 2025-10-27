import Link from 'next/link'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-brand-primary shadow-lg">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="text-brand-light">
            <h1 className="text-2xl md:text-3xl font-bold tracking-[3px]">SFT</h1>
          </Link>
          <ul className="flex gap-4 md:gap-8">
            <li>
              <Link
                href="/"
                className="text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-sm md:text-base"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/explore"
                className="text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-sm md:text-base"
              >
                Collection
              </Link>
            </li>
            <li>
              <Link
                href="/order"
                className="text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-sm md:text-base"
              >
                Place Order
              </Link>
            </li>
            <li>
              <Link
                href="#about"
                className="text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-sm md:text-base"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="#contact"
                className="text-brand-light hover:text-brand-secondary transition-colors uppercase tracking-wide text-sm md:text-base"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}
