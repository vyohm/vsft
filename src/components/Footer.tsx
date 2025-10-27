import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-brand-primary text-brand-light py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p>&copy; 2024 SFT. All rights reserved.</p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="hover:text-brand-secondary transition-colors"
            >
              Instagram
            </Link>
            <Link
              href="#"
              className="hover:text-brand-secondary transition-colors"
            >
              Facebook
            </Link>
            <Link
              href="#"
              className="hover:text-brand-secondary transition-colors"
            >
              Twitter
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
