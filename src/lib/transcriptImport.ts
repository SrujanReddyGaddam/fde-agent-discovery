import Anthropic from '@anthropic-ai/sdk'
import { sections } from '../data/inquiryGuide'

export interface ImportResult {
  answers: Record<string, string>
  confidence: Record<string, 'high' | 'medium' | 'low' | 'none'>
  flaggedTopics: string[]   // topics mentioned but couldn't map to a specific question
  coverage: number          // % of questions that got an answer
  raw: string
}

function buildPrompt(transcript: string): string {
  const questionList = sections.flatMap(s =>
    s.questions.map(q => ({
      id: q.id,
      section: s.label,
      question: q.question,
      goodSignal: q.goodSignal,
      why: q.why,
    }))
  )

  return `You are a senior FDE (Forward Deployed Engineer) at UiPath analyzing a discovery call transcript.

Your job is to extract answers to specific qualification questions from the transcript and populate a discovery questionnaire. Be rigorous — only populate a field if there is actual evidence in the transcript. Do NOT invent or infer beyond what was said.

## Discovery Questions to Answer

${questionList.map(q => `**${q.id}** [${q.section}]
Question: ${q.question}
What a good answer looks like: ${q.goodSignal}`).join('\n\n')}

## Transcript

${transcript}

---

## Instructions

For each question ID above, extract the most relevant answer from the transcript.

Rules:
- If the topic was clearly discussed, extract the key facts as 2-4 sentences in the FDE's voice (first person notes, not a quote)
- If the topic was partially touched on, note what was said and what's still unclear
- If the topic was NOT discussed at all, return null for that question — do not guess
- Assign confidence: "high" (directly stated), "medium" (implied or partial), "low" (very thin evidence)
- Flag any important topics from the transcript that don't map to a specific question

Return ONLY a valid JSON object with this exact shape:
{
  "answers": {
    "A1": "...",
    "A2": null,
    "B1": "...",
    ...
  },
  "confidence": {
    "A1": "high",
    "B1": "medium",
    ...
  },
  "flaggedTopics": ["topic that came up but didn't fit a question", ...]
}

Only include question IDs that have actual content (non-null). Omit nulls from the answers object entirely.`
}

export async function importTranscript(apiKey: string, transcript: string): Promise<ImportResult> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const prompt = buildPrompt(transcript)

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI response did not contain valid JSON')

  const parsed = JSON.parse(match[0])
  const answers: Record<string, string> = parsed.answers || {}
  const confidence: Record<string, 'high' | 'medium' | 'low' | 'none'> = parsed.confidence || {}
  const flaggedTopics: string[] = parsed.flaggedTopics || []

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0)
  const coverage = Math.round((Object.keys(answers).length / totalQuestions) * 100)

  return { answers, confidence, flaggedTopics, coverage, raw }
}
