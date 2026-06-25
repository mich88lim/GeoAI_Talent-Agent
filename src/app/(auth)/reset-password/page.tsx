'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/i18n/LanguageProvider'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

export default function ResetPasswordPage() {
  const { t } = useLanguage()
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/update-password`,
    })

    if (authError) {
      setError(authError.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-semibold text-slate">
          {t.auth.resetPasswordTitle}
        </h2>
        <p className="text-sm text-muted">{t.auth.resetPasswordSubtitle}</p>
      </div>

      {error && <Alert variant="error" message={error} />}
      {sent  && <Alert variant="success" message={t.auth.resetPasswordSent} />}

      {!sent && (
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
          <Button type="submit" loading={loading} className="w-full mt-2">
            {t.auth.sendResetLink}
          </Button>
        </form>
      )}

      <p className="text-center text-sm">
        <Link href="/login" className="font-medium text-royal-blue hover:underline">
          {t.auth.backToLogin}
        </Link>
      </p>
    </div>
  )
}
