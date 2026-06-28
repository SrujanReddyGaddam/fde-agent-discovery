import { callLLM, extractJSON, type LLMConfig } from './llmClient'
import { sections, type Section } from '../data/inquiryGuide'

export interface ImportResult {
  answers: Record<string, string>
  confidence: Record<string, 'high' | 'medium' | 'low' | 'none'>
  flaggedTopics: string[]
  coverage: number
  raw: string
}

export type ImportProgress = {
  current: number
  total: number
  label: string
}

// Batch sections to keep each prompt small enough for local models
// Groups of 2-3 sections per call
function batchSections(batchSize = 2): Section[][] {
  const batches: Section[][] = []
  for (let i = 0; i < sections.length; i += batchSize) {
    batches.push(sections.slice(i, i + batchSize))
  }
  return batches
}

function buildBatchPrompt(transcript: string, batch: Section[]): string {
  const questions = batch.flatMap(s =>
    s.questions.map(q => `${q.id}: ${q.question}`)
  )

  return `You are analyzing a discovery call transcript. Extract answers to ONLY these specific questions.

RULES:
- Only fill a field if the transcript directly discusses it
- If not mentioned, omit it entirely
- Keep answers to 2-3 sentences max
- Return ONLY raw JSON, no explanation, no markdown

QUESTIONS TO ANSWER:
${questions.join('\n')}

TRANSCRIPT:
${transcript.slice(0, 6000)}

Respond with ONLY this JSON structure, no other text:
{"answers":{"A1":"answer here"},"confidence":{"A1":"high"}}`
}

function buildFlagPrompt(transcript: string): string {
  return `Read this discovery call transcript and identify any important business topics that came up but don't fit neatly into standard discovery questions (e.g. unusual constraints, political issues, competitive concerns, timing pressures).

TRANSCRIPT:
${transcript.slice(0, 4000)}

Return ONLY this JSON, no other text:
{"flaggedTopics":["topic 1","topic 2"]}`
}

export async function importTranscript(
  llmConfig: LLMConfig,
  transcript: string,
  onProgress?: (p: ImportProgress) => void,
): Promise<ImportResult> {
  const batches = batchSections(2)
  const allAnswers: Record<string, string> = {}
  const allConfidence: Record<string, 'high' | 'medium' | 'low' | 'none'> = {}
  let allRaw = ''
  let flaggedTopics: string[] = []

  const total = batches.length + 1 // +1 for flagged topics call

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    const sectionLabels = batch.map(s => s.id).join(', ')
    onProgress?.({ current: i + 1, total, label: `Sections ${sectionLabels}` })

    const prompt = buildBatchPrompt(transcript, batch)
    try {
      const raw = await callLLM(
        llmConfig,
        [{ role: 'user', content: prompt }],
        1024,
      )
      allRaw += `\n--- Batch ${sectionLabels} ---\n${raw}`

      const parsed = extractJSON(raw) as any
      if (parsed?.answers) {
        Object.assign(allAnswers, parsed.answers)
      }
      if (parsed?.confidence) {
        Object.assign(allConfidence, parsed.confidence)
      }
    } catch {
      // Skip failed batch — partial results are fine
    }
  }

  // Final call: flagged topics
  onProgress?.({ current: total, total, label: 'Flagged topics' })
  try {
    const flagRaw = await callLLM(
      llmConfig,
      [{ role: 'user', content: buildFlagPrompt(transcript) }],
      256,
    )
    const flagParsed = extractJSON(flagRaw) as any
    flaggedTopics = flagParsed?.flaggedTopics || []
  } catch {
    // Not critical
  }

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0)
  const coverage = Math.round((Object.keys(allAnswers).length / totalQuestions) * 100)

  return {
    answers: allAnswers,
    confidence: allConfidence,
    flaggedTopics,
    coverage,
    raw: allRaw,
  }
}
