import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.VSFT_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get recent webhook logs from a simple log table
    const { data: logs, error } = await supabase
      .from('whatsapp_webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error && error.code !== 'PGRST116') { // Ignore table doesn't exist error
      throw error
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
      message: logs?.length ? `Found ${logs.length} webhook logs` : 'No logs yet. Send a WhatsApp message to your business number to test!'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch logs', details: error.message },
      { status: 500 }
    )
  }
}
