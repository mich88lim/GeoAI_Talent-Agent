import { en } from './en'
import { bm } from './bm'

export type Locale = 'en' | 'bm'
export type { Translations } from './en'

export const translations = { en, bm } as const

export const LOCALE_COOKIE = 'geo-talent-lang'
export const DEFAULT_LOCALE: Locale = 'bm'

export function getTranslations(locale: Locale) {
  return translations[locale] ?? translations[DEFAULT_LOCALE]
}

export function isValidLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'bm'
}
