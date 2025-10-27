import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CatalogueGrid from '@/components/CatalogueGrid'

export default function ExplorePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen py-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-light text-center mb-12 tracking-[2px]">
            Explore Our Collection
          </h1>
          <CatalogueGrid />
        </div>
      </main>
      <Footer />
    </>
  )
}
