import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { invoiceService } from '@/lib/services/invoice'
import { whatsappService } from '@/lib/services/whatsapp'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.VSFT_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    // Fetch order with customer and items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        items:order_items(*)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if customer has verified WhatsApp
    if (!order.customer.is_whatsapp_verified) {
      return NextResponse.json(
        {
          error: 'WhatsApp not verified',
          message: 'Customer must verify their WhatsApp number before receiving invoice'
        },
        { status: 400 }
      )
    }

    // Get the verified WhatsApp number (fallback to phone number)
    const whatsappNumber = order.customer.whatsapp_phone_number || order.customer.phone_number

    if (!whatsappNumber) {
      return NextResponse.json(
        { error: 'No phone number found for customer' },
        { status: 400 }
      )
    }

    // Prepare invoice data
    const invoiceData = {
      orderId: order.id,
      orderNumber: order.id.substring(0, 8).toUpperCase(),
      orderDate: order.created_at,
      customer: {
        name: order.customer.name,
        company_name: order.customer.company_name,
        phone_number: order.customer.phone_number,
        gst_number: order.customer.gst_number
      },
      items: order.items.map((item: any) => ({
        design_number: item.design_number,
        quantity: item.quantity,
        unit_price: item.unit_price,
        size: item.size,
        color: item.color
      })),
      totalAmount: order.total_amount
    }

    // Generate PDF
    console.log('Generating invoice PDF...')
    const pdfBuffer = await invoiceService.generateInvoice(invoiceData)

    // Upload to Supabase Storage
    const filename = `invoice-${invoiceData.orderNumber}-${Date.now()}.pdf`
    const filePath = `${orderId}/${filename}`

    console.log('Uploading PDF to storage...')
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(filePath)

    console.log('PDF uploaded, public URL:', publicUrl)

    // Send via WhatsApp
    console.log('Sending invoice via WhatsApp to:', whatsappNumber)
    await whatsappService.sendDocument(
      whatsappNumber,
      publicUrl,
      filename,
      `📄 Invoice for Order #${invoiceData.orderNumber}\n\nThank you for your order, ${order.customer.name}! 🙏\n\nTotal Amount: ₹${order.total_amount.toLocaleString('en-IN')}`
    )

    // Update order to mark invoice as sent
    await supabase
      .from('orders')
      .update({
        invoice_sent: true,
        invoice_sent_at: new Date().toISOString(),
        invoice_url: publicUrl
      })
      .eq('id', orderId)

    return NextResponse.json({
      success: true,
      message: 'Invoice sent successfully',
      invoiceUrl: publicUrl
    })

  } catch (error: any) {
    console.error('Error sending invoice:', error)
    return NextResponse.json(
      { error: 'Failed to send invoice', details: error.message },
      { status: 500 }
    )
  }
}
