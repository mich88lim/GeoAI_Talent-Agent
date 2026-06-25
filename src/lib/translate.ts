import { llm } from './llm'
import type { Locale } from '@/i18n'

const LANG_NAMES: Record<Locale, string> = {
  en: 'English',
  bm: 'Bahasa Melayu (Malaysian standard)',
}

// translate(text, targetLang) — converts free/dynamic text on demand via the LLM.
// Used for user-typed titles, notes, and assistant chat — NOT for fixed UI strings
// (those come from the i18n files directly).
export async function translate(text: string, targetLang: Locale): Promise<string> {
  if (!text.trim()) return text

  return llm(
    [
      {
        role: 'system',
        content:
          `You are a professional translator for the Malaysian Ministry of Education. ` +
          `Translate the given text into ${LANG_NAMES[targetLang]}. ` +
          `Return ONLY the translated text — no explanations, no quotation marks, no annotations. ` +
          `Preserve line breaks and any markdown formatting.`,
      },
      { role: 'user', content: text },
    ],
    { temperature: 0.2, maxTokens: 1024 }
  )
}
