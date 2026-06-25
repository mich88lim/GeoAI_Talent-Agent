import { NextResponse } from 'next/server'
import { translate } from '@/lib/translate'
import { isValidLocale } from '@/i18n'
import { createClient } from '@/lib/supabase/server'

// POST /api/translate
// Body: { text: string; targetLang: 'en' | 'bm' }
// Returns: { translated: string }
// Requires: authenticated session

export async function POST(request: Request) {
  // Auth check — only authenticated users may call this endpoint
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { text?: unknown; targetLang?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { text, targetLang } = body

  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'text must be a non-empty string' }, { status: 400 })
  }
  if (!isValidLocale(targetLang)) {
    return NextResponse.json({ error: 'targetLang must be "en" or "bm"' }, { status: 400 })
  }

  try {
    const translated = await translate(text, targetLang)
    return NextResponse.json({ translated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Translation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
