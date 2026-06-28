import { callLLM, extractJSON, type LLMConfig } from './llmClient'
import { sections } from '../data/inquiryGuide'
import { redFlags } from '../data/redFlags'
import { rubricDimensions, MAX_RUBRIC_SCORE } from '../data/rubric'
import { scorecardDomains } from '../data/scorecard'

interface VerdictInput {
  llmConfig: LLMConfig
  meta: { customerName: string; useCaseName: string; date: string; fde: string; useCaseSummary: string }
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
- Use Case: ${meta.useCaseName || 'Not named'}
- Summary: ${meta.useCaseSummary || 'Not summarized'}
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

Based on all of the above, respond with a JSON object with this exact shape:
{
  "gate": "PUSH TO PROD" or "CONDITIONAL" or "PAUSE" or "NO-GO",
  "confidence": <number 0-100>,
  "summary": "<2-3 sentence sharp executive summary>",
  "blockers": [{"title": "<short>", "detail": "<1-2 sentences>"}],
  "signals": [{"title": "<short>", "detail": "<1-2 sentences>"}],
  "nextSteps": ["<action>", "<action>", "<action>"]
}

Gate criteria:
- PUSH TO PROD: strong economics, stakeholder triad present, data accessible, ≤2 critical red flags
- CONDITIONAL: viable path but 1-2 critical gaps need resolution before build begins
- PAUSE: significant structural gaps, revisit in 4-6 weeks
- NO-GO: fundamental disqualifiers — economics don't work, liability unresolvable

Be direct. Return only valid JSON, no markdown fences.`
}

export async function generateVerdict(input: VerdictInput): Promise<VerdictResult> {
  const prompt = buildPrompt(input)
  const raw = await callLLM(input.llmConfig, [{ role: 'user', content: prompt }], 1024)
  const parsed = extractJSON(raw) as any

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
