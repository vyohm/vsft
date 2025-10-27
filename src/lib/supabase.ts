import { createClient } from '@supabase/supabase-js'

// Use fallback values during build, real values at runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Log warning in development/runtime if using placeholders
if (typeof window !== 'undefined' && supabaseUrl.includes('placeholder')) {
  console.error('⚠️ Supabase environment variables not set! Check Vercel settings.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
