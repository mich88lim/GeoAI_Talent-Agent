'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/i18n/LanguageProvider'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

export default function UpdatePasswordPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError(t.auth.passwordsNoMatch)
      return
    }
    if (password.length < 8) {
      setError(t.auth.passwordTooShort)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.updateUser({ password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-semibold text-slate">
          {t.auth.updatePasswordTitle}
        </h2>
        <p className="text-sm text-muted">{t.auth.updatePasswordSubtitle}</p>
      </div>

      {error && <Alert variant="error" message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t.auth.newPasswordLabel}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <Input
          label={t.auth.confirmPasswordLabel}
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
        />
        <Button type="submit" loading={loading} className="w-full mt-2">
          {t.auth.updatePassword}
        </Button>
      </form>
    </div>
  )
}
