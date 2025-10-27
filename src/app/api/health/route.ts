import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl: supabaseUrl ? 'set' : 'missing',
      supabaseUrlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined',
      supabaseKey: supabaseKey ? 'set' : 'missing',
      supabaseKeyPreview: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'undefined',
      allSupabaseEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE')),
    },
  })
}
