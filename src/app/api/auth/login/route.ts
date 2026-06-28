import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/auth/login
// Proxies the Supabase sign-in server-side so the browser never needs a
// direct connection to the Supabase auth endpoint (works on restricted networks).
export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const email    = typeof body.email    === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  // Fetch profile status to tell the client where to redirect
  const { data: { user } } = await supabase.auth.getUser()
  let status = 'active'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('user_id', user.id)
      .single()
    status = profile?.status ?? 'pending'
  }

  return NextResponse.json({ success: true, profileStatus: status })
}
