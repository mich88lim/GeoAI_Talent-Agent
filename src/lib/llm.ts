// Provider-agnostic LLM client (OpenAI-compatible).
// Current provider: Groq. Swap by setting LLM_PROVIDER / LLM_BASE_URL / LLM_MODEL in env.
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

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

export async function llm(messages: Message[], opts: LLMOptions = {}): Promise<string> {
  const provider  = process.env.LLM_PROVIDER   ?? 'groq'
  const baseUrl   = process.env.LLM_BASE_URL    ?? 'https://api.groq.com/openai/v1'
  const model     = opts.model ?? process.env.LLM_MODEL ?? 'llama-3.3-70b-versatile'

  const apiKey =
    provider === 'anthropic'
      ? process.env.ANTHROPIC_API_KEY
      : process.env.GROQ_API_KEY

  if (!apiKey) {
    throw new Error(`LLM API key not configured for provider: ${provider}`)
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.3,
        max_tokens:  opts.maxTokens  ?? 512,
      }),
    })

    if (res.status === 429) {
      // Exponential back-off on rate limit
      const delay = BASE_DELAY_MS * Math.pow(2, attempt)
      await new Promise(r => setTimeout(r, delay))
      continue
    }

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`LLM API error ${res.status}: ${body}`)
    }

    const data = await res.json()
    return (data.choices[0].message.content as string).trim()
  }

  throw new Error('LLM: max retries exceeded (rate limit / 429)')
}
