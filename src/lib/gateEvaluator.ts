
export interface Gate {
  id: number
  label: string
  description: string
  passCriteria: string
  failAction: string
}

export interface GateResult {
  gate: Gate
  status: 'pass' | 'fail' | 'unknown' | 'locked'
  evidence: string
}

export const GATES: Gate[] = [
  {
    id: 1,
    label: 'Volume Known',
    description: 'Volume is quantified and > 10K/year',
    passCriteria: 'A specific number has been entered for volume and labor cost questions',
    failAction: 'Get volume before next meeting. If they can\'t produce it, deprioritize.',
  },
  {
    id: 2,
    label: 'Labor Cost Clears Bar',
    description: 'Labor cost > ~$20/case',
    passCriteria: 'Labor cost per case is above the minimum FDE-time threshold',
    failAction: 'Consider COTS or rule-based RPA. Don\'t burn FDE time.',
  },
  {
    id: 3,
    label: 'Decision Logic Clear',
    description: 'Rules documented OR judgment + 100+ labeled examples',
    passCriteria: 'Decision logic section answered with clear rule book or labeled data reference',
    failAction: 'First deliverable is the rule book or labeling pass. Set that expectation explicitly.',
  },
  {
    id: 4,
    label: 'Error Risk Scoped',
    description: 'Error asymmetry understood and HITL scope defined if high-risk',
    passCriteria: 'Risk and failure modes answered, error direction identified',
    failAction: 'Scope for human-in-the-loop from v1. Do not build autonomous path.',
  },
  {
    id: 5,
    label: 'Stakeholder Triad Present',
    description: 'Exec sponsor + operational owner + technical counterpart all named',
    passCriteria: 'All three stakeholder roles are named in the discovery notes',
    failAction: 'Get the missing person before any architecture work begins.',
  },
  {
    id: 6,
    label: 'Data Access Feasible',
    description: 'Real data accessible within 4 weeks',
    passCriteria: 'Data access plan answered, no critical data blockers flagged',
    failAction: 'Use synthetic data for v0 while access work runs in parallel. Surface as risk.',
  },
  {
    id: 7,
    label: 'Production Owner Named',
    description: 'Post-launch owner identified before build begins',
    passCriteria: 'Production ownership and support model answered',
    failAction: 'Set the 90-day FDE → customer handoff expectation now. Do not let it become indefinite.',
  },
]

function hasContent(answers: Record<string, string>, ids: string[]): boolean {
  return ids.some(id => answers[id]?.trim().length > 20)
}

function flagTriggered(triggeredFlags: string[], ids: string[]): boolean {
  return ids.some(id => triggeredFlags.includes(id))
}

export function evaluateGates(
  answers: Record<string, string>,
  triggeredFlags: string[],
  rubricScores: Record<string, number>,
): GateResult[] {
  const results: GateResult[] = []
  let firstFail = -1

  const evaluations: Array<{ status: 'pass' | 'fail' | 'unknown'; evidence: string }> = [
    // Gate 1: Volume known
    (() => {
      const hasVolume = hasContent(answers, ['A2', 'A3', 'A4'])
      const noVolumeFlag = flagTriggered(triggeredFlags, ['RF01'])
      const volumeScore = rubricScores['volume'] || 0
      if (noVolumeFlag) return { status: 'fail' as const, evidence: 'Red flag RF01 triggered: no volume data' }
      if (volumeScore >= 1 && hasVolume) return { status: 'pass' as const, evidence: `Volume rubric scored ${volumeScore}/5 with supporting notes` }
      if (hasVolume) return { status: 'pass' as const, evidence: 'Volume and process details answered' }
      return { status: 'unknown' as const, evidence: 'Volume questions not yet answered (A2, A3, A4)' }
    })(),

    // Gate 2: Labor cost clears bar
    (() => {
      const hasValue = hasContent(answers, ['E1', 'E2', 'E3'])
      const noValueFlag = flagTriggered(triggeredFlags, ['RF02'])
      const laborScore = rubricScores['labor_cost'] || 0
      const tokenScore = rubricScores['token_economics'] || 0
      if (noValueFlag) return { status: 'fail' as const, evidence: 'Red flag RF02 triggered: no quantified value' }
      if (flagTriggered(triggeredFlags, ['RF20'])) return { status: 'fail' as const, evidence: 'Red flag RF20 triggered: LLM token cost exceeds labor savings' }
      if (laborScore >= 3 && tokenScore >= 3) return { status: 'pass' as const, evidence: `Labor cost ${laborScore}/5, token economics ${tokenScore}/5` }
      if (laborScore >= 2 && hasValue) return { status: 'pass' as const, evidence: 'Value case answered with reasonable labor cost score' }
      if (hasValue) return { status: 'unknown' as const, evidence: 'Value noted but not yet scored in rubric' }
      return { status: 'unknown' as const, evidence: 'Value and impact questions not yet answered (E1–E3)' }
    })(),

    // Gate 3: Decision logic clear
    (() => {
      const hasLogic = hasContent(answers, ['C1', 'C2', 'C3', 'C4'])
      const noRulesFlag = flagTriggered(triggeredFlags, ['RF10'])
      const multiDecisionFlag = flagTriggered(triggeredFlags, ['RF09'])
      if (multiDecisionFlag) return { status: 'fail' as const, evidence: 'RF09: Multiple decisions disguised as one — force a single scope first' }
      if (noRulesFlag) return { status: 'fail' as const, evidence: 'RF10: No rule book exists. First deliverable must be writing it.' }
      if (hasLogic) return { status: 'pass' as const, evidence: 'Decision logic and complexity sections answered' }
      return { status: 'unknown' as const, evidence: 'Decision logic questions not yet answered (C1–C4)' }
    })(),

    // Gate 4: Error risk scoped
    (() => {
      const hasRisk = hasContent(answers, ['F1', 'F2', 'F3'])
      const asymmetricFlag = flagTriggered(triggeredFlags, ['RF08'])
      if (asymmetricFlag) return {
        status: 'fail' as const,
        evidence: 'RF08: Asymmetric high-cost errors with no mitigation strategy. Must scope HITL from v1.',
      }
      if (hasRisk) return { status: 'pass' as const, evidence: 'Risk and failure modes documented' }
      return { status: 'unknown' as const, evidence: 'Risk questions not yet answered (F1–F3)' }
    })(),

    // Gate 5: Stakeholder triad
    (() => {
      const hasSponsor = hasContent(answers, ['B1'])
      const hasOperator = hasContent(answers, ['B2'])
      const hasTechnical = hasContent(answers, ['J3'])
      const noSponsorFlag = flagTriggered(triggeredFlags, ['RF03'])
      const noOwnerFlag = flagTriggered(triggeredFlags, ['RF04'])
      const noCounterpartFlag = flagTriggered(triggeredFlags, ['RF13'])
      const stakeholderScore = rubricScores['stakeholder_readiness'] || 0
      if (noSponsorFlag || noOwnerFlag || noCounterpartFlag) {
        const missing = [noSponsorFlag && 'exec sponsor', noOwnerFlag && 'operational owner', noCounterpartFlag && 'technical counterpart'].filter(Boolean).join(', ')
        return { status: 'fail' as const, evidence: `Missing: ${missing}` }
      }
      if (stakeholderScore <= 2) return { status: 'fail' as const, evidence: `Stakeholder readiness scored ${stakeholderScore}/5 — fewer than 2 of 3 roles present` }
      if (hasSponsor && hasOperator && hasTechnical) return { status: 'pass' as const, evidence: 'All three stakeholder roles documented' }
      if (hasSponsor && hasOperator) return { status: 'unknown' as const, evidence: 'Sponsor and operator noted. Technical counterpart (J3) not yet confirmed.' }
      return { status: 'unknown' as const, evidence: 'Stakeholder questions not yet answered (B1, B2, J3)' }
    })(),

    // Gate 6: Data access feasible
    (() => {
      const hasData = hasContent(answers, ['D1', 'D3', 'D5'])
      const noDataFlag = flagTriggered(triggeredFlags, ['RF05', 'RF15', 'RF11'])
      if (noDataFlag) {
        return { status: 'fail' as const, evidence: 'Data access or compliance blocker flagged. Engage legal/data owner in week 1.' }
      }
      if (hasData) return { status: 'pass' as const, evidence: 'Data access plan and constraints documented' }
      return { status: 'unknown' as const, evidence: 'Data access questions not yet answered (D1, D3, D5)' }
    })(),

    // Gate 7: Production owner named
    (() => {
      const hasOwner = hasContent(answers, ['H4', 'I1'])
      const noOwnerFlag = flagTriggered(triggeredFlags, ['RF16'])
      if (noOwnerFlag) return { status: 'fail' as const, evidence: 'RF16: No post-launch owner. Bake a named owner into the v1 SOW.' }
      if (hasOwner) return { status: 'pass' as const, evidence: 'Production ownership and success criteria documented' }
      return { status: 'unknown' as const, evidence: 'Production owner questions not yet answered (H4, I1)' }
    })(),
  ]

  for (let i = 0; i < GATES.length; i++) {
    const eval_ = evaluations[i]
    let status: GateResult['status'] = eval_.status

    if (firstFail !== -1 && i > firstFail) {
      status = 'locked'
    } else if (status === 'fail' && firstFail === -1) {
      firstFail = i
    }

    results.push({
      gate: GATES[i],
      status,
      evidence: eval_.evidence,
    })
  }

  return results
}

export function getGateSummary(results: GateResult[]): {
  passed: number
  failed: number
  unknown: number
  locked: number
  stoppedAt: number | null
  recommendation: string
} {
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const unknown = results.filter(r => r.status === 'unknown').length
  const locked = results.filter(r => r.status === 'locked').length
  const stoppedAt = results.find(r => r.status === 'fail')?.gate.id ?? null

  let recommendation = ''
  if (passed === 7) recommendation = 'All gates cleared. Proceed to architecture sprint.'
  else if (stoppedAt === 1 || stoppedAt === 2) recommendation = 'Fundamental economics not yet established. Do not invest FDE time until resolved.'
  else if (stoppedAt === 3) recommendation = 'Decision logic undefined. First deliverable is the rule book, not the agent.'
  else if (stoppedAt === 4) recommendation = 'Error risk unmitigated. Scope must include HITL before any autonomous build begins.'
  else if (stoppedAt === 5) recommendation = 'Stakeholder triad incomplete. No architecture work until missing role is named.'
  else if (stoppedAt === 6) recommendation = 'Data access unresolved. Begin synthetic data v0 while access work runs in parallel.'
  else if (stoppedAt === 7) recommendation = 'Production owner undefined. Set handoff expectation in the v1 SOW.'
  else if (unknown > 0) recommendation = 'Discovery still in progress. Complete remaining sections to evaluate all gates.'

  return { passed, failed, unknown, locked, stoppedAt, recommendation }
}
