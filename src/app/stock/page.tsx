import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StockGrid from '@/components/StockGrid'

export default function StockPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen py-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-light text-center mb-12 tracking-[2px]">
            Stock Inventory
          </h1>
          <StockGrid />
        </div>
      </main>
      <Footer />
    </>
  )
}
