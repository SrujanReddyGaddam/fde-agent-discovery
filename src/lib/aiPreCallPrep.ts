import { callLLM, extractJSON, type LLMConfig } from './llmClient'
import { sections } from '../data/inquiryGuide'

export interface PrepQuestion {
  id: string
  question: string
  why: string
  script: string
  priority: 'critical' | 'high' | 'medium'
}

export interface PreCallPrep {
  summary: string
  questions: PrepQuestion[]
  watchFor: string[]
}

export async function generatePreCallPrep(
  llmConfig: LLMConfig,
  customerName: string,
  useCaseName: string,
  useCaseSummary: string,
): Promise<PreCallPrep> {
  const allQuestions = sections.flatMap(s =>
    s.questions.map(q => `${q.id}|${s.label}|${q.question}`)
  ).join('\n')

  const prompt = `You are a senior UiPath FDE preparing for a discovery call.

CUSTOMER: ${customerName || 'Unknown'}
USE CASE: ${useCaseName || 'Unknown'}
SUMMARY: ${useCaseSummary || 'No summary provided'}

ALL AVAILABLE DISCOVERY QUESTIONS:
${allQuestions}

Based on the use case above, select the 8-10 MOST IMPORTANT questions to ask in the first hour of this specific discovery call. Prioritize questions that will quickly reveal if this is a viable agentic use case.

For each question, write a natural conversational script tailored to this specific use case — not generic.

Also list 3 things to specifically watch for with this type of use case.

Return ONLY this JSON, no other text:
{
  "summary": "One sentence on the strategic angle to take in this call",
  "questions": [
    {
      "id": "A1",
      "question": "The question text",
      "why": "Why this matters for THIS specific use case",
      "script": "Natural way to ask it for this customer",
      "priority": "critical"
    }
  ],
  "watchFor": ["Thing to watch for 1", "Thing to watch for 2", "Thing to watch for 3"]
}`

  const raw = await callLLM(llmConfig, [{ role: 'user', content: prompt }], 2048)
  const parsed = extractJSON(raw) as any

  return {
    summary: parsed?.summary || '',
    questions: parsed?.questions || [],
    watchFor: parsed?.watchFor || [],
  }
}
