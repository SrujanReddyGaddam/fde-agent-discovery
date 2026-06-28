import Anthropic from '@anthropic-ai/sdk'
import { sections } from '../data/inquiryGuide'
import { redFlags } from '../data/redFlags'
import { rubricDimensions, MAX_RUBRIC_SCORE } from '../data/rubric'
import { scorecardDomains } from '../data/scorecard'

interface VerdictInput {
  apiKey: string
  meta: { customerName: string; date: string; fde: string; useCaseSummary: string }
  answers: Record<string, string>
  triggeredFlags: string[]
  rubricScores: Record<string, number>
  scorecardScores: Record<string, number>
  scorecardNotes: Record<string, string>
}

export interface VerdictResult {
  gate: 'PUSH TO PROD' | 'CONDITIONAL' | 'PAUSE' | 'NO-GO'
  confidence: number
  summary: string
  blockers: { title: string; detail: string }[]
  signals: { title: string; detail: string }[]
  nextSteps: string[]
  raw: string
}

function buildPrompt(input: VerdictInput): string {
  const { meta, answers, triggeredFlags, rubricScores, scorecardScores, scorecardNotes } = input

  const triggered = redFlags.filter(f => triggeredFlags.includes(f.id))
  const criticalFlags = triggered.filter(f => f.severity === 'critical')

  const rubricTotal = rubricDimensions.reduce((sum, d) => sum + (rubricScores[d.id] || 0) * d.weight, 0)
  const rubricPct = Math.round((rubricTotal / MAX_RUBRIC_SCORE) * 100)

  const scorecardSummary = scorecardDomains.map(d => {
    const s = scorecardScores[d.id] || 0
    const tier = s <= 7 ? 'Below Baseline' : s <= 14 ? 'Baseline' : s <= 20 ? 'Strong' : 'Elite'
    return `${d.shortLabel}: ${s}/25 (${tier}) — ${scorecardNotes[d.id] || 'No evidence note'}`
  }).join('\n')

  const answerSummary = sections.flatMap(s =>
    s.questions.map(q => `[${q.id}] ${q.question}\nAnswer: ${answers[q.id] || 'Not answered'}`)
  ).join('\n\n')

  return `You are a senior UiPath Forward Deployed Engineering (FDE) leader evaluating a customer discovery call to determine if this use case qualifies for an "agentic push to production."

Your job is to make a clear gate decision and provide a sharp, honest assessment.

## Customer Context
- Customer: ${meta.customerName || 'Unknown'}
- Use Case: ${meta.useCaseSummary || 'Not summarized'}
- Date: ${meta.date}
- FDE: ${meta.fde || 'Unknown'}

## Discovery Q&A Summary
${answerSummary}

## Red Flags Triggered: ${triggered.length}/22 (${criticalFlags.length} CRITICAL)
${triggered.map(f => `- [${f.severity.toUpperCase()}] ${f.flag}`).join('\n') || 'None'}

## Impact Rubric: ${rubricTotal}/${MAX_RUBRIC_SCORE} (${rubricPct}%)
${rubricDimensions.map(d => `- ${d.label}: ${rubricScores[d.id] || 0}/5 (weight: ${d.weight}x)`).join('\n')}

## FDE Agentic Scorecard
${scorecardSummary}

---

Based on all of the above, respond with a JSON object with this exact shape:

{
  "gate": "PUSH TO PROD" | "CONDITIONAL" | "PAUSE" | "NO-GO",
  "confidence": <number 0-100>,
  "summary": "<2-3 sentence sharp executive summary of your verdict>",
  "blockers": [
    { "title": "<short blocker title>", "detail": "<1-2 sentence explanation>" }
  ],
  "signals": [
    { "title": "<short signal title>", "detail": "<1-2 sentence explanation>" }
  ],
  "nextSteps": ["<actionable next step>", "<actionable next step>", "<actionable next step>"]
}

Gate criteria:
- PUSH TO PROD: ≥3 scorecard domains at Baseline+, rubric ≥60%, ≤2 critical red flags, clear exec sponsor + data access + operational owner
- CONDITIONAL: Viable path exists but 1-2 critical gaps need resolution in next 2 weeks before build begins
- PAUSE: Significant structural gaps — not enough data, no sponsor, unclear value — revisit in 4-6 weeks when gaps are resolved
- NO-GO: Fundamental disqualifiers present (economics don't work, liability unresolvable, no business case)

Be direct. Don't hedge. Surface the single most important risk. Return only valid JSON.`
}

export async function generateVerdict(input: VerdictInput): Promise<VerdictResult> {
  const client = new Anthropic({
    apiKey: input.apiKey,
    dangerouslyAllowBrowser: true,
  })

  const prompt = buildPrompt(input)

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''

  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI response did not contain valid JSON')

  const parsed = JSON.parse(jsonMatch[0])

  return {
    gate: parsed.gate,
    confidence: parsed.confidence,
    summary: parsed.summary,
    blockers: parsed.blockers || [],
    signals: parsed.signals || [],
    nextSteps: parsed.nextSteps || [],
    raw,
  }
}
