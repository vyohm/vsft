import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="min-h-[80vh] flex items-center justify-center text-center px-4 bg-gradient-to-br from-brand-primary to-brand-quaternary">
          <div className="space-y-8">
            <div className="mb-6">
              <Image
                src="/assets/logos/sft-logo.png"
                alt="SFT Logo"
                width={200}
                height={200}
                className="mx-auto"
              />
            </div>
            <h2 className="text-4xl md:text-6xl font-light text-brand-light tracking-[2px]">
              Welcome to SFT
            </h2>
            <p className="text-xl md:text-2xl text-brand-tertiary tracking-wide">
              Elevate Your Style
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/explore">
                <button className="bg-brand-secondary text-brand-primary px-10 py-4 rounded-full font-semibold uppercase tracking-wide hover:bg-brand-tertiary transform hover:-translate-y-0.5 transition-all shadow-lg w-full sm:w-auto">
                  Explore Kerala Expo Collection
                </button>
              </Link>
              <Link href="/order">
                <button className="bg-brand-light text-brand-primary px-10 py-4 rounded-full font-semibold uppercase tracking-wide hover:bg-brand-tertiary transform hover:-translate-y-0.5 transition-all shadow-lg border-2 border-brand-light w-full sm:w-auto">
                  Start Order
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Collection Preview */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-light text-center mb-12 tracking-[2px]">
              Our Collection
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {[
                { img: 'https://adncxesithjuzyhcsuff.supabase.co/storage/v1/object/public/test-buck/photoshoots/NK0005.png', title: 'Design NK0005' },
                { img: 'https://adncxesithjuzyhcsuff.supabase.co/storage/v1/object/public/test-buck/photoshoots/RS0008.png', title: 'Design RS0008' },
                { img: 'https://adncxesithjuzyhcsuff.supabase.co/storage/v1/object/public/test-buck/photoshoots/SFT1550.png', title: 'Design SFT1550' },
                { img: 'https://adncxesithjuzyhcsuff.supabase.co/storage/v1/object/public/test-buck/photoshoots/SFT1671.png', title: 'Design SFT1671' },
                { img: 'https://adncxesithjuzyhcsuff.supabase.co/storage/v1/object/public/test-buck/photoshoots/SFT1726.png', title: 'Design SFT1726' },
                { img: 'https://adncxesithjuzyhcsuff.supabase.co/storage/v1/object/public/test-buck/photoshoots/SFT1810.png', title: 'Design SFT1810' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className="relative w-full aspect-[2/3] bg-gradient-to-br from-brand-tertiary to-brand-quaternary p-1">
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/explore">
                <button className="bg-brand-primary text-brand-light px-10 py-4 rounded-full font-semibold uppercase tracking-wide hover:bg-brand-secondary hover:text-brand-primary transition-all shadow-lg">
                  View Full Catalogue
                </button>
              </Link>
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
