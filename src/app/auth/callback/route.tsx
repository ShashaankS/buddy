import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { ensureUserExists } from '@/lib/user-utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
    
    // Ensure user exists in database (fallback if trigger fails)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await ensureUserExists(user)
    }
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
