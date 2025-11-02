import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '@/lib/services/whatsapp'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.VSFT_SERVICE_ROLE_KEY!
)

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get order and customer details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, customers(*)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const customer = order.customers

    // Generate verification code
    const verificationCode = generateVerificationCode()

    // Save verification code to customer
    const { error: updateError } = await supabase
      .from('customers')
      .update({ verification_code: verificationCode })
      .eq('id', customer.id)

    if (updateError) {
      throw updateError
    }

    // Send WhatsApp message
    const message = `Hello ${customer.name}! 👋\n\nThank you for your order #${order.id}!\n\nTo verify your WhatsApp number and receive order updates, please reply with this code:\n\n*${verificationCode}*\n\nThis helps us confirm your order and keep you updated on delivery.\n\n- SFT Team`

    await whatsappService.sendMessage(customer.phone_number, message)

    return NextResponse.json({
      success: true,
      message: 'Verification code sent via WhatsApp'
    })

  } catch (error: any) {
    console.error('Error sending verification:', error)
    return NextResponse.json(
      { error: 'Failed to send verification code', details: error.message },
      { status: 500 }
    )
  }
}
