import { callLLM, extractJSON, type LLMConfig } from './llmClient'
import { rubricDimensions } from '../data/rubric'

export interface RubricSuggestion {
  scores: Record<string, number>
  reasoning: Record<string, string>
}

export async function suggestRubricScores(
  llmConfig: LLMConfig,
  answers: Record<string, string>,
): Promise<RubricSuggestion> {
  const notesText = Object.entries(answers)
    .filter(([, v]) => v?.trim().length > 5)
    .map(([k, v]) => `[${k}] ${v.trim()}`)
    .join('\n\n')

  if (!notesText) throw new Error('No discovery notes to score from.')

  const dimList = rubricDimensions.map(d => {
    const anchors = d.anchors.map(a => `  ${a.score}="${a.label}: ${a.description}"`).join('\n')
    return `${d.id} (${d.label}, ${d.category === 'opportunity' ? 'higher=better' : 'higher=more risk'}):\n${anchors}`
  }).join('\n\n')

  const prompt = `You are an FDE evaluating a discovery call. Based on the notes below, suggest a score (1, 2, 3, 4, or 5) for each rubric dimension.

RUBRIC DIMENSIONS:
${dimList}

DISCOVERY NOTES:
${notesText.slice(0, 5000)}

Score each dimension based only on what the notes say. If a dimension is not mentioned, score it 3 (middle).

Return ONLY this JSON, no other text:
{"scores":{"volume":4,"labor_cost":5},"reasoning":{"volume":"Short reason","labor_cost":"Short reason"}}`

  const raw = await callLLM(llmConfig, [{ role: 'user', content: prompt }], 1024)
  const parsed = extractJSON(raw) as any

  return {
    scores: parsed?.scores || {},
    reasoning: parsed?.reasoning || {},
  }
}
