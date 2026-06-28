// Provider-agnostic LLM client (OpenAI-compatible).
// Current provider: Groq. Swap by setting LLM_PROVIDER / LLM_BASE_URL / LLM_MODEL in env.
// Supports key rotation: GROQ_API_KEY (main) → GROQ_API_KEY_2 → GROQ_API_KEY_3 on 429.
// All LLM calls in this project go through this wrapper — never call provider APIs directly.

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface LLMOptions {
  model?: string
  temperature?: number
  maxTokens?: number
}

const BASE_DELAY_MS = 1000

function getGroqKeys(): string[] {
  return [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
  ].filter((k): k is string => Boolean(k))
}

export async function llm(messages: Message[], opts: LLMOptions = {}): Promise<string> {
  const provider = process.env.LLM_PROVIDER ?? 'groq'
  const baseUrl  = process.env.LLM_BASE_URL ?? 'https://api.groq.com/openai/v1'
  const model    = opts.model ?? process.env.LLM_MODEL ?? 'llama-3.3-70b-versatile'

  const keys =
    provider === 'anthropic'
      ? [process.env.ANTHROPIC_API_KEY].filter((k): k is string => Boolean(k))
      : getGroqKeys()

  if (keys.length === 0) {
    throw new Error(`LLM API key not configured for provider: ${provider}`)
  }

  // Try each key in order on 429. After all keys are exhausted, back off and retry once.
  const ROUNDS = 2
  for (let round = 0; round < ROUNDS; round++) {
    for (let ki = 0; ki < keys.length; ki++) {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keys[ki]}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts.temperature ?? 0.3,
          max_tokens:  opts.maxTokens  ?? 512,
        }),
      })

      if (res.status === 429) {
        // Rate limited on this key — try the next key immediately
        if (ki < keys.length - 1) continue
        // All keys exhausted this round — exponential back-off before next round
        const delay = BASE_DELAY_MS * Math.pow(2, round)
        await new Promise(r => setTimeout(r, delay))
        break
      }

      if (!res.ok) {
        const body = await res.text()
        throw new Error(`LLM API error ${res.status}: ${body}`)
      }

      const data = await res.json()
      return (data.choices[0].message.content as string).trim()
    }
  }

  throw new Error(`LLM: all ${keys.length} key(s) rate-limited after ${ROUNDS} rounds`)
}
