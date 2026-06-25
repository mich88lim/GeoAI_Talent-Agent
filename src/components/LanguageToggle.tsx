'use client'

import { useLanguage } from '@/i18n/LanguageProvider'

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useLanguage()

  return (
    <div
      className={`inline-flex items-center rounded-full border border-border bg-white p-0.5 text-xs font-medium shadow-sm ${className}`}
      role="group"
      aria-label={t.common.language}
    >
      <button
        onClick={() => setLocale('en')}
        className={`rounded-full px-3 py-1 transition-colors duration-150 ${
          locale === 'en'
            ? 'bg-ink-navy text-white shadow-sm'
            : 'text-muted hover:text-slate'
        }`}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
      <button
        onClick={() => setLocale('bm')}
        className={`rounded-full px-3 py-1 transition-colors duration-150 ${
          locale === 'bm'
            ? 'bg-ink-navy text-white shadow-sm'
            : 'text-muted hover:text-slate'
        }`}
        aria-pressed={locale === 'bm'}
      >
        BM
      </button>
    </div>
  )
}
