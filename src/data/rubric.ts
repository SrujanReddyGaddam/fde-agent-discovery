export interface RubricAnchor {
  score: 1 | 3 | 5
  label: string
  description: string
}

export interface RubricDimension {
  id: string
  label: string
  category: 'opportunity' | 'risk'
  weight: number
  why: string
  anchors: RubricAnchor[]
}

// category = 'opportunity': higher score = more valuable (green at 5)
// category = 'risk': higher score = more risky (red at 5, requires mitigation)
export const rubricDimensions: RubricDimension[] = [
  {
    id: 'volume',
    label: 'Volume',
    category: 'opportunity',
    weight: 1,
    why: 'The denominator of the entire ROI math. No volume = no value.',
    anchors: [
      { score: 1, label: 'Low', description: '< 10K cases/year' },
      { score: 3, label: 'Medium', description: '100K – 1M cases/year' },
      { score: 5, label: 'High', description: '1M+, or < 100K with $500+/case' },
    ],
  },
  {
    id: 'labor_cost',
    label: 'Labor Cost per Case',
    category: 'opportunity',
    weight: 1,
    why: 'Sets the ceiling of what automation is worth. Below $20/case, FDE time doesn\'t pencil.',
    anchors: [
      { score: 1, label: 'Low', description: '< $5 per case' },
      { score: 3, label: 'Medium', description: '$20 – $100 per case' },
      { score: 5, label: 'High', description: '$500+ (clinical, legal, financial review)' },
    ],
  },
  {
    id: 'token_economics',
    label: 'Token Economics at Scale',
    category: 'opportunity',
    weight: 1,
    why: 'LLM cost at production volume can flip a profitable use case negative. Score high = efficient.',
    anchors: [
      { score: 1, label: 'Poor', description: '$5/case in LLM cost — likely exceeds labor savings' },
      { score: 3, label: 'Viable', description: '$0.50 – $5/case — acceptable with optimization' },
      { score: 5, label: 'Efficient', description: '< $0.50/case (small models, deterministic extraction, cached prompts)' },
    ],
  },
  {
    id: 'speed_value',
    label: 'Speed Value',
    category: 'opportunity',
    weight: 1,
    why: 'If faster turnaround has a dollar value (SLA penalty, revenue unlock), speed becomes a multiplier.',
    anchors: [
      { score: 1, label: 'Low', description: 'No SLA, async is fine — speed doesn\'t move a needle' },
      { score: 3, label: 'Medium', description: 'SLA exists and is often missed — speed has soft value' },
      { score: 5, label: 'High', description: 'External regulatory or customer SLA with hard financial penalty' },
    ],
  },
  {
    id: 'decision_complexity',
    label: 'Decision Complexity',
    category: 'risk',
    weight: 1,
    why: 'Pure rules = faster build, lower risk. Pure judgment = harder to eval, harder to trust.',
    anchors: [
      { score: 1, label: 'Rule-Based', description: 'Pure rules, well-documented — deterministic, fast to build' },
      { score: 3, label: 'Mixed', description: 'Mix of rules + judgment — needs LLM, needs eval suite' },
      { score: 5, label: 'Pure Judgment', description: 'No rule book exists — first deliverable is writing it (add 4–6 weeks)' },
    ],
  },
  {
    id: 'data_availability',
    label: 'Data Availability',
    category: 'risk',
    weight: 1,
    why: 'Data cleanup often dwarfs model work. Scattered or locked data adds months.',
    anchors: [
      { score: 1, label: 'Ready', description: 'Clean, structured, accessible — build can start immediately' },
      { score: 3, label: 'Manageable', description: 'Semi-structured, some quality issues — plan for prep sprint' },
      { score: 5, label: 'Blocked', description: 'Unstructured, scattered, or PII-locked — legal/data access risk' },
    ],
  },
  {
    id: 'ground_truth',
    label: 'Ground-Truth Labels',
    category: 'risk',
    weight: 1,
    why: 'Evaluation is impossible without ground truth. No labels = you can\'t measure if the agent works.',
    anchors: [
      { score: 1, label: 'Exists', description: 'Labeled set of 1000+ cases already exists' },
      { score: 3, label: 'Partial', description: 'Some labels available, needs cleanup and expansion' },
      { score: 5, label: 'None', description: 'No labels — must build the labeling process from scratch (add weeks)' },
    ],
  },
  {
    id: 'error_tolerance',
    label: 'Error Tolerance',
    category: 'risk',
    weight: 1,
    why: 'Asymmetric high-cost errors require HITL from v1 — scopes and slows the build significantly.',
    anchors: [
      { score: 1, label: 'Forgiving', description: 'Symmetric errors, auto-detected, low downstream cost' },
      { score: 3, label: 'Moderate', description: 'Some asymmetry — one direction is more costly, manageable with monitoring' },
      { score: 5, label: 'High Stakes', description: 'Asymmetric high-cost errors (regulatory action, life-safety, legal liability)' },
    ],
  },
  {
    id: 'stakeholder_readiness',
    label: 'Stakeholder Readiness',
    category: 'risk',
    weight: 1,
    why: 'Missing any one of the triad (sponsor/operator/technical) kills the project at a different phase.',
    anchors: [
      { score: 1, label: 'Full Triad', description: 'Exec sponsor + operational owner + technical counterpart all named' },
      { score: 3, label: 'Partial', description: '2 of 3 roles present — identify the missing one before build' },
      { score: 5, label: 'Missing', description: '< 2 of 3 present — no air cover, no adoption path, no counterpart' },
    ],
  },
  {
    id: 'strategic_visibility',
    label: 'Strategic Visibility',
    category: 'opportunity',
    weight: 1,
    why: 'C-suite visibility means air cover, funding protection, and reference customer potential.',
    anchors: [
      { score: 1, label: 'Operational', description: 'Internal efficiency only — not cited in any leadership narrative' },
      { score: 3, label: 'On Roadmap', description: 'Cited in team or org roadmap — has some backing' },
      { score: 5, label: 'C-Suite', description: 'Named in executive, board, or external narrative — high visibility' },
    ],
  },
  {
    id: 'reusability',
    label: 'Reusability',
    category: 'opportunity',
    weight: 2,
    why: '2× weighted. Vertical IP that repeats across the portfolio justifies deeper FDE investment.',
    anchors: [
      { score: 1, label: 'One-Off', description: 'Specific to this customer — no reuse potential identified' },
      { score: 3, label: 'Repeatable', description: 'Pattern repeats in 2–3 other engagements in the pipeline' },
      { score: 5, label: 'Vertical IP', description: 'Pattern repeats across the customer portfolio — build once, deploy many' },
    ],
  },
]

export const MAX_RUBRIC_SCORE = rubricDimensions.reduce((sum, d) => sum + 5 * d.weight, 0)
