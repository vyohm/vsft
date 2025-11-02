import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section
          className="min-h-[80vh] flex items-center justify-center text-center px-4 relative bg-cover bg-center"
          style={{ backgroundImage: "url('/assets/images/theme.png')" }}
        >
          <div className="absolute inset-0 bg-brand-primary/40"></div>
          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl md:text-6xl font-light text-brand-light tracking-[2px] drop-shadow-lg">
              Welcome to SFT
            </h2>
            <p className="text-xl md:text-2xl text-brand-light tracking-wide drop-shadow-md">
              Elevate Your Style
            </p>
            <div className="flex flex-col gap-4 items-center">
              <Link href="/order">
                <button className="bg-brand-secondary text-brand-primary px-10 py-4 rounded-full font-semibold uppercase tracking-wide hover:bg-brand-light hover:text-brand-primary transform hover:-translate-y-0.5 transition-all shadow-lg">
                  Start Order
                </button>
              </Link>
              <Link href="/explore">
                <button className="bg-brand-primary text-brand-light px-10 py-4 rounded-full font-semibold uppercase tracking-wide hover:bg-brand-secondary hover:text-brand-primary transform hover:-translate-y-0.5 transition-all shadow-lg">
                  Explore Collection
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
