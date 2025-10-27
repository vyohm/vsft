import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { formatDate, formatPrice } from '@/lib/utils'
import { notFound } from 'next/navigation'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface OrderPageProps {
  params: Promise<{
    orderId: string
  }>
}

export default async function OrderDetailPage({ params }: OrderPageProps) {
  const { orderId } = await params

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      order_items(*, catalogue_item:catalogue_items(*))
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) {
    notFound()
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-brand-primary mb-2">
                Order Confirmed!
              </h1>
              <p className="text-brand-quaternary">
                Thank you for your order. We'll send you a confirmation email shortly.
              </p>
            </div>

            <div className="border-t border-b border-gray-200 py-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-brand-quaternary">Order Number:</span>
                <span className="font-semibold">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-quaternary">Date:</span>
                <span className="font-semibold">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-quaternary">Status:</span>
                <span className="inline-flex px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  {order.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
              <div className="space-y-2">
                <p>
                  <span className="text-brand-quaternary">Name:</span>{' '}
                  {order.customer.name}
                </p>
                {order.customer.company_name && (
                  <p>
                    <span className="text-brand-quaternary">Company:</span>{' '}
                    {order.customer.company_name}
                  </p>
                )}
                {order.customer.gst_number && (
                  <p>
                    <span className="text-brand-quaternary">GST Number:</span>{' '}
                    {order.customer.gst_number}
                  </p>
                )}
                <p>
                  <span className="text-brand-quaternary">Phone:</span>{' '}
                  {order.customer.phone_number}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.order_items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-brand-tertiary rounded-lg"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-brand-tertiary to-brand-quaternary rounded-lg">
                        {item.catalogue_item?.image_url && (
                          <img
                            src={item.catalogue_item.image_url}
                            alt={item.catalogue_item.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          Design #{item.design_number}
                        </h3>
                        <div className="flex gap-4 text-sm mt-1">
                          <span>Qty: {item.quantity}</span>
                          <span>Color: {item.color_option}</span>
                          <span>{formatPrice(item.unit_price)} each</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-brand-secondary">
                        {formatPrice(item.line_total || item.unit_price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 bg-brand-secondary rounded-lg">
              <div className="flex justify-between items-center text-brand-primary">
                <span className="text-xl font-bold">Order Total:</span>
                <span className="text-2xl font-bold">{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
