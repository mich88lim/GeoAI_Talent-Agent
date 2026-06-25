import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from '@/i18n'
import { isValidLocale, DEFAULT_LOCALE, LOCALE_COOKIE } from '@/i18n'
import { cookies } from 'next/headers'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, ppd_district, status')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.status !== 'active') redirect('/awaiting-approval')

  // Read language from cookie for server-rendered strings
  const cookieStore = await cookies()
  const rawLang = cookieStore.get(LOCALE_COOKIE)?.value
  const locale = isValidLocale(rawLang) ? rawLang : DEFAULT_LOCALE
  const t = getTranslations(locale)

  async function handleSignOut() {
    'use server'
    const { createClient: sc } = await import('@/lib/supabase/server')
    const sb = await sc()
    await sb.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-white px-6 py-3 shadow-sm">
        <Image
          src="/logo_horizontal.svg"
          alt="GEO-TALENT AGENT"
          width={160}
          height={36}
          className="h-8 w-auto"
        />
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">
            {profile.full_name ?? user.email}
            {profile.role === 'admin' && (
              <span className="ml-2 inline-flex items-center rounded-full bg-royal-blue/10 px-2 py-0.5 text-xs font-medium text-royal-blue">
                Admin
              </span>
            )}
          </span>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="text-sm text-muted hover:text-slate transition-colors"
            >
              {t.common.signOut}
            </button>
          </form>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="max-w-lg text-center space-y-4 animate-fade-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal/10">
            <svg className="h-8 w-8 text-teal" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate">
              {t.dashboard.welcome} {profile.full_name?.split(' ')[0] ?? ''}
            </h1>
            <p className="mt-1 text-sm text-muted">{t.dashboard.subtitle}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-6 text-sm text-muted shadow-card">
            <p>{t.dashboard.comingSoon}</p>
            {profile.role === 'admin' && (
              <a
                href="/admin/users"
                className="mt-3 inline-flex items-center text-royal-blue hover:underline font-medium"
              >
                {t.admin.usersTitle} →
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
