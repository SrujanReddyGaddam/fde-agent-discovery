import Anthropic from '@anthropic-ai/sdk'
import { redFlags } from '../data/redFlags'

interface DetectionInput {
  apiKey: string
  answers: Record<string, string>
  currentlyTriggered: string[]
}

export interface DetectionResult {
  suggested: string[]   // flag IDs the AI thinks should be triggered
  reasoning: string     // one-sentence rationale
}

export async function autoDetectFlags(input: DetectionInput): Promise<DetectionResult> {
  const { apiKey, answers, currentlyTriggered } = input

  const notesText = Object.entries(answers)
    .filter(([, v]) => v?.trim().length > 10)
    .map(([k, v]) => `[${k}] ${v.trim()}`)
    .join('\n\n')

  if (!notesText) return { suggested: [], reasoning: 'No notes to analyze.' }

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const flagList = redFlags.map(f => `${f.id} [${f.severity.toUpperCase()}]: ${f.flag}`).join('\n')

  const prompt = `You are a senior UiPath FDE reviewing discovery call notes for red flags.

Here are the 22 red flags to check for:
${flagList}

Here are the FDE's notes from the discovery call:
${notesText}

Already flagged by the FDE: ${currentlyTriggered.join(', ') || 'none'}

Based ONLY on what is written in the notes, identify which red flags are clearly present or strongly implied.
Be conservative — only flag something if there is actual evidence in the notes. Don't flag on absence of information.

Return a JSON object:
{
  "suggested": ["RF01", "RF05", ...],  // IDs from the list above that are evidenced in the notes
  "reasoning": "One sentence explaining the most important finding."
}

Return only valid JSON.`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return { suggested: [], reasoning: 'Could not parse AI response.' }

  const parsed = JSON.parse(match[0])
  return {
    suggested: (parsed.suggested || []).filter((id: string) => redFlags.find(f => f.id === id)),
    reasoning: parsed.reasoning || '',
  }
}
