import { callLLM, extractJSON, type LLMConfig } from './llmClient'
import { redFlags } from '../data/redFlags'

interface DetectionInput {
  llmConfig: LLMConfig
  answers: Record<string, string>
  currentlyTriggered: string[]
}

export interface DetectionResult {
  suggested: string[]
  reasoning: string
}

export async function autoDetectFlags(input: DetectionInput): Promise<DetectionResult> {
  const { llmConfig, answers, currentlyTriggered } = input

  const notesText = Object.entries(answers)
    .filter(([, v]) => v?.trim().length > 10)
    .map(([k, v]) => `[${k}] ${v.trim()}`)
    .join('\n\n')

  if (!notesText) return { suggested: [], reasoning: 'No notes to analyze.' }

  const flagList = redFlags.map(f => `${f.id} [${f.severity.toUpperCase()}]: ${f.flag}`).join('\n')

  const prompt = `You are a senior UiPath FDE reviewing discovery call notes for red flags.

Red flags to check for:
${flagList}

FDE notes from the discovery call:
${notesText}

Already flagged: ${currentlyTriggered.join(', ') || 'none'}

Based ONLY on what is written in the notes, identify which red flags are clearly present or strongly implied. Be conservative — only flag something if there is actual evidence.

Return JSON only, no markdown:
{
  "suggested": ["RF01", "RF05"],
  "reasoning": "One sentence on the most important finding."
}`

  const raw = await callLLM(llmConfig, [{ role: 'user', content: prompt }], 256)
  const parsed = extractJSON(raw) as any

  return {
    suggested: (parsed.suggested || []).filter((id: string) => redFlags.find(f => f.id === id)),
    reasoning: parsed.reasoning || '',
  }
}
