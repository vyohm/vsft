import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '@/lib/services/whatsapp'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.VSFT_SERVICE_ROLE_KEY!
)

// GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('Webhook verified successfully')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

// POST endpoint for incoming messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Parse the incoming message
    const parsedMessage = whatsappService.parseIncomingMessage(body)

    if (!parsedMessage || parsedMessage.type !== 'message') {
      return NextResponse.json({ status: 'ignored' })
    }

    // Only process text messages
    if (parsedMessage.messageType !== 'text') {
      return NextResponse.json({ status: 'ignored' })
    }

    const phoneNumber = parsedMessage.from
    const messageText = parsedMessage.text?.trim()

    console.log('Received message:', { phoneNumber, messageText })

    // Check if this is a verification code (6 digits)
    if (messageText && /^\d{6}$/.test(messageText)) {
      await handleVerificationCode(phoneNumber, messageText, parsedMessage.messageId)
    }

    return NextResponse.json({ status: 'ok' })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleVerificationCode(
  phoneNumber: string,
  code: string,
  messageId: string
) {
  try {
    // Find customer with this phone number and verification code
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('verification_code', code)
      .single()

    if (customerError || !customer) {
      // Invalid or expired code
      await whatsappService.sendMessage(
        phoneNumber,
        "Sorry, that verification code doesn't match or has expired. Please request a new one."
      )
      return
    }

    // Mark customer as verified
    const { error: updateCustomerError } = await supabase
      .from('customers')
      .update({
        is_whatsapp_verified: true,
        whatsapp_verified_at: new Date().toISOString(),
        verification_code: null // Clear the code
      })
      .eq('id', customer.id)

    if (updateCustomerError) {
      throw updateCustomerError
    }

    // Find the most recent order for this customer and mark it as verified
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (orders && orders.length > 0) {
      await supabase
        .from('orders')
        .update({
          is_whatsapp_verified: true,
          whatsapp_verified_at: new Date().toISOString()
        })
        .eq('id', orders[0].id)
    }

    // Send success message
    await whatsappService.sendMessage(
      phoneNumber,
      `✅ Verified! Thank you ${customer.name}!\n\nYour WhatsApp number has been verified. You'll receive updates about your order here.\n\n- SFT Team`
    )

    // Mark the verification message as read
    await whatsappService.markAsRead(messageId)

  } catch (error) {
    console.error('Error handling verification code:', error)
  }
}
