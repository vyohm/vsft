import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import OrderForm from '@/components/OrderForm'

export default function OrderPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-light text-center mb-12 tracking-[2px]">
            Place Your Order
          </h1>
          <OrderForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
