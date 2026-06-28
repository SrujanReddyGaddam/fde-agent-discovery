// Unified LLM client — routes to Anthropic or any OpenAI-compatible local endpoint

export type LLMProvider = 'anthropic' | 'local'

export interface LLMConfig {
  provider: LLMProvider
  anthropicKey: string
  localBaseUrl: string   // e.g. http://localhost:1234/v1
  localModel: string     // e.g. llama-3.2-11b-instruct
}

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function callLLM(
  config: LLMConfig,
  messages: LLMMessage[],
  maxTokens = 2048,
): Promise<string> {
  if (config.provider === 'anthropic') {
    return callAnthropic(config.anthropicKey, messages, maxTokens)
  } else {
    return callLocalLLM(config.localBaseUrl, config.localModel, messages, maxTokens)
  }
}

async function callAnthropic(apiKey: string, messages: LLMMessage[], maxTokens: number): Promise<string> {
  // Dynamically import to avoid bundling issues when not used
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  // Separate system message if present
  const system = messages.find(m => m.role === 'system')?.content
  const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    ...(system ? { system } : {}),
    messages: userMessages,
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

async function callLocalLLM(
  baseUrl: string,
  model: string,
  messages: LLMMessage[],
  maxTokens: number,
): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.1,   // low temp for structured output reliability
      stream: false,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Local LLM error ${response.status}: ${text.slice(0, 200)}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

// Extract JSON from a response that might have markdown fences or prose around it
export function extractJSON(raw: string): unknown {
  // Try direct parse first
  try { return JSON.parse(raw) } catch {}

  // Strip markdown code fences
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()) } catch {}
  }

  // Find first { ... } block
  const match = raw.match(/\{[\s\S]*\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch {}
  }

  throw new Error('No valid JSON found in response')
}
