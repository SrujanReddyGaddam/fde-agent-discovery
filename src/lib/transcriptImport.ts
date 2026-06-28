import { callLLM, extractJSON, type LLMConfig } from './llmClient'
import { sections } from '../data/inquiryGuide'

export interface ImportResult {
  answers: Record<string, string>
  confidence: Record<string, 'high' | 'medium' | 'low' | 'none'>
  flaggedTopics: string[]
  coverage: number
  raw: string
}

function buildPrompt(transcript: string): string {
  const questionList = sections.flatMap(s =>
    s.questions.map(q => ({
      id: q.id,
      section: s.label,
      question: q.question,
      goodSignal: q.goodSignal,
    }))
  )

  return `You are a senior FDE at UiPath analyzing a discovery call transcript. Extract answers to the qualification questions below.

Only populate a field if there is actual evidence in the transcript. Do NOT invent or infer beyond what was said. Leave fields null if the topic was not discussed.

## Questions
${questionList.map(q => `${q.id} [${q.section}]: ${q.question}\nGood answer looks like: ${q.goodSignal}`).join('\n\n')}

## Transcript
${transcript}

Return ONLY valid JSON (no markdown fences):
{
  "answers": {
    "A1": "2-4 sentence summary in FDE note style",
    "A2": null
  },
  "confidence": {
    "A1": "high"
  },
  "flaggedTopics": ["topic mentioned but not mapped to a question"]
}

Confidence levels: "high" = directly stated, "medium" = implied/partial, "low" = thin evidence.
Omit null values from answers object entirely. Only include confidence entries for answered questions.`
}

export async function importTranscript(llmConfig: LLMConfig, transcript: string): Promise<ImportResult> {
  const prompt = buildPrompt(transcript)
  const raw = await callLLM(llmConfig, [{ role: 'user', content: prompt }], 4096)
  const parsed = extractJSON(raw) as any

  const answers: Record<string, string> = parsed.answers || {}
  const confidence: Record<string, 'high' | 'medium' | 'low' | 'none'> = parsed.confidence || {}
  const flaggedTopics: string[] = parsed.flaggedTopics || []
  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0)
  const coverage = Math.round((Object.keys(answers).length / totalQuestions) * 100)

  return { answers, confidence, flaggedTopics, coverage, raw }
}
