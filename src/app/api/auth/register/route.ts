import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? 'moe.gov.my'

// POST /api/auth/register
// Validates email domain (or admin allowlist), then calls supabase.auth.signUp.
// Server-side only — the allowlist check uses the service-role key.
export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown; fullName?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email    = typeof body.email    === 'string' ? body.email.toLowerCase().trim()  : ''
  const password = typeof body.password === 'string' ? body.password                    : ''
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim()             : ''

  if (!email || !password || !fullName) {
    return NextResponse.json({ error: 'email, password, and fullName are required' }, { status: 400 })
  }

  // ── Email domain / allowlist check ───────────────────────────
  const isAllowedDomain = email.endsWith(`@${ALLOWED_DOMAIN}`)

  if (!isAllowedDomain) {
    // Check the admin_allowlist (requires service key — never exposed to client)
    try {
      const adminClient = createAdminClient()
      const { data: entry } = await adminClient
        .from('admin_allowlist')
        .select('email')
        .eq('email', email)
        .maybeSingle()

      if (!entry) {
        return NextResponse.json(
          { error: `This email address is not permitted to register. Please use your official @${ALLOWED_DOMAIN} email address or contact an administrator.` },
          { status: 403 }
        )
      }
    } catch {
      // SUPABASE_SERVICE_KEY not configured → fail closed
      return NextResponse.json(
        { error: `This email address is not permitted to register. Please use your official @${ALLOWED_DOMAIN} email address.` },
        { status: 403 }
      )
    }
  }

  // ── Sign up ───────────────────────────────────────────────────
  const supabase = await createClient()
  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
