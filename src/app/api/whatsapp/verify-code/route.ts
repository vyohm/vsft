import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.VSFT_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, verificationCode } = await request.json()

    if (!phoneNumber || !verificationCode) {
      return NextResponse.json(
        { success: false, message: 'Phone number and verification code are required' },
        { status: 400 }
      )
    }

    // Find customer with this phone number and verification code
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('verification_code', verificationCode)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Mark customer as verified
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        is_whatsapp_verified: true,
        whatsapp_verified_at: new Date().toISOString(),
        verification_code: null
      })
      .eq('id', customer.id)

    if (updateError) {
      console.error('Error updating customer:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to verify code' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification successful',
      customer: {
        id: customer.id,
        name: customer.name,
        phone_number: customer.phone_number,
        is_whatsapp_verified: true
      }
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
