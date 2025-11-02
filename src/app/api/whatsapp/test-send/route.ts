import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '@/lib/services/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json()

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      )
    }

    // Send WhatsApp message
    const result = await whatsappService.sendMessage(phoneNumber, message)

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: result
    })

  } catch (error: any) {
    console.error('Error sending test message:', error)
    return NextResponse.json(
      {
        error: 'Failed to send message',
        details: error.response?.data || error.message
      },
      { status: 500 }
    )
  }
}
