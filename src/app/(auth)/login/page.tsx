'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/i18n/LanguageProvider'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

export default function LoginPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Check profile status to route correctly
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('user_id', user.id)
        .single()

      if (profile?.status === 'pending') {
        router.push('/awaiting-approval')
      } else {
        router.push('/dashboard')
      }
    }
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-semibold text-slate">
          {t.auth.loginTitle}
        </h2>
        <p className="text-sm text-muted">{t.auth.loginSubtitle}</p>
      </div>

      {error && <Alert variant="error" message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t.auth.emailLabel}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@moe.gov.my"
        />
        <div className="space-y-1">
          <Input
            label={t.auth.passwordLabel}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <div className="text-right">
            <Link
              href="/reset-password"
              className="text-xs text-royal-blue hover:underline"
            >
              {t.auth.forgotPassword}
            </Link>
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full mt-2">
          {t.auth.signIn}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        {t.auth.noAccount}{' '}
        <Link href="/register" className="font-medium text-royal-blue hover:underline">
          {t.auth.register}
        </Link>
      </p>
    </div>
  )
}
