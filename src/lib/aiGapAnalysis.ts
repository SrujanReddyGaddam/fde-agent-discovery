import { callLLM, extractJSON, type LLMConfig } from './llmClient'
import { scorecardDomains } from '../data/scorecard'

export interface GapAnalysis {
  currentTier: string
  targetTier: string
  actions: { title: string; detail: string }[]
  timeframe: string
}

function getTier(score: number): string {
  if (score <= 7) return 'Below Baseline'
  if (score <= 14) return 'Baseline'
  if (score <= 20) return 'Strong'
  return 'Elite'
}

function getNextTier(score: number): string {
  if (score <= 7) return 'Baseline'
  if (score <= 14) return 'Strong'
  if (score <= 20) return 'Elite'
  return 'Elite'
}

export async function generateGapAnalysis(
  llmConfig: LLMConfig,
  domainId: string,
  score: number,
  evidenceNote: string,
): Promise<GapAnalysis> {
  const domain = scorecardDomains.find(d => d.id === domainId)
  if (!domain) throw new Error('Domain not found')

  const currentTier = getTier(score)
  const targetTier = getNextTier(score)

  if (currentTier === 'Elite') {
    return {
      currentTier: 'Elite',
      targetTier: 'Elite',
      actions: [{ title: 'Already at Elite', detail: 'This domain is at the highest tier. Focus on maintaining and documenting patterns for other engagements.' }],
      timeframe: 'N/A',
    }
  }

  const currentTierDesc = domain.tiers.find(t => score >= t.range[0] && score <= t.range[1])?.description || ''
  const targetTierDesc = domain.tiers.find(t => t.label === targetTier)?.description || ''

  const prompt = `You are a senior FDE coach helping improve an agentic implementation scorecard.

DOMAIN: ${domain.label}
CURRENT SCORE: ${score}/25 (${currentTier})
TARGET: ${targetTier}

CURRENT TIER DESCRIPTION:
${currentTierDesc}

TARGET TIER DESCRIPTION:
${targetTierDesc}

ASSESSMENT QUESTIONS FOR THIS DOMAIN:
${domain.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

FDE EVIDENCE NOTE:
${evidenceNote || 'No evidence note provided.'}

Give 3 specific, concrete actions the FDE should take to move this implementation from ${currentTier} to ${targetTier}. Be specific — not generic advice.

Return ONLY this JSON, no other text:
{"actions":[{"title":"Short action title","detail":"1-2 sentence specific action"}],"timeframe":"e.g. 2-4 weeks"}`

  const raw = await callLLM(llmConfig, [{ role: 'user', content: prompt }], 512)
  const parsed = extractJSON(raw) as any

  return {
    currentTier,
    targetTier,
    actions: parsed?.actions || [],
    timeframe: parsed?.timeframe || '2-4 weeks',
  }
}
