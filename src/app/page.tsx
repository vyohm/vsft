import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="min-h-[80vh] flex items-center justify-center text-center px-4 bg-gradient-to-br from-brand-primary to-brand-quaternary">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl font-light text-brand-light tracking-[2px]">
              Welcome to SFT
            </h2>
            <p className="text-xl md:text-2xl text-brand-tertiary tracking-wide">
              Elevate Your Style
            </p>
            <Link href="/explore">
              <button className="bg-brand-secondary text-brand-primary px-10 py-4 rounded-full font-semibold uppercase tracking-wide hover:bg-brand-tertiary transform hover:-translate-y-0.5 transition-all shadow-lg">
                Explore Collection
              </button>
            </Link>
          </div>
        </section>

        {/* Collection Preview */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-light text-center mb-12 tracking-[2px]">
              Our Collection
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Spring Collection', desc: 'Discover the latest trends' },
                { title: 'Summer Essentials', desc: 'Light and breezy designs' },
                { title: 'Premium Line', desc: 'Luxury meets comfort' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg overflow-hidden shadow-lg hover:-translate-y-2 transition-transform"
                >
                  <div className="h-72 bg-gradient-to-br from-brand-tertiary to-brand-quaternary"></div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-brand-quaternary">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 px-4 bg-brand-tertiary">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-light text-center mb-8 tracking-[2px]">
              About SFT
            </h2>
            <p className="max-w-3xl mx-auto text-center text-lg leading-relaxed">
              SFT is a contemporary fashion brand dedicated to creating timeless pieces
              that blend elegance with modern style. Our commitment to quality and design
              excellence sets us apart in the world of fashion.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-light text-center mb-12 tracking-[2px]">
              Get In Touch
            </h2>
            <form className="max-w-2xl mx-auto space-y-6">
              <input
                type="text"
                placeholder="Name"
                required
                className="w-full p-4 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary transition-colors"
              />
              <input
                type="email"
                placeholder="Email"
                required
                className="w-full p-4 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary transition-colors"
              />
              <textarea
                placeholder="Message"
                rows={5}
                required
                className="w-full p-4 border-2 border-brand-quaternary rounded-lg focus:outline-none focus:border-brand-secondary transition-colors resize-y"
              />
              <button
                type="submit"
                className="w-full bg-brand-secondary text-brand-primary px-10 py-4 rounded-full font-semibold uppercase tracking-wide hover:bg-brand-tertiary transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
