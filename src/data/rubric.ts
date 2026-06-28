export interface RubricDimension {
  id: string
  label: string
  weight: number
  anchors: { score: 1 | 3 | 5; description: string }[]
}

export const rubricDimensions: RubricDimension[] = [
  {
    id: 'volume',
    label: 'Volume',
    weight: 1,
    anchors: [
      { score: 1, description: '< 10K cases/year' },
      { score: 3, description: '100K – 1M cases/year' },
      { score: 5, description: '1M+, or < 100K with $500+/case' },
    ],
  },
  {
    id: 'labor_cost',
    label: 'Labor Cost per Case',
    weight: 1,
    anchors: [
      { score: 1, description: '< $5 per case' },
      { score: 3, description: '$20 – $100 per case' },
      { score: 5, description: '$500+ (clinical, legal, financial review)' },
    ],
  },
  {
    id: 'token_economics',
    label: 'Token Economics at Scale',
    weight: 1,
    anchors: [
      { score: 1, description: '$5/case in LLM cost' },
      { score: 3, description: '$0.50 – $5/case' },
      { score: 5, description: '< $0.50/case (small models, deterministic extraction, cached prompts)' },
    ],
  },
  {
    id: 'speed_value',
    label: 'Speed Value',
    weight: 1,
    anchors: [
      { score: 1, description: 'No SLA, async OK' },
      { score: 3, description: 'SLA exists, often missed' },
      { score: 5, description: 'External regulatory or customer SLA with hard penalty' },
    ],
  },
  {
    id: 'decision_complexity',
    label: 'Decision Complexity',
    weight: 1,
    anchors: [
      { score: 1, description: 'Pure rules, well-documented' },
      { score: 3, description: 'Mix of rules + judgment' },
      { score: 5, description: 'Pure judgment, no rule book exists yet' },
    ],
  },
  {
    id: 'data_availability',
    label: 'Data Availability',
    weight: 1,
    anchors: [
      { score: 1, description: 'Clean, structured, accessible' },
      { score: 3, description: 'Semi-structured, some quality issues' },
      { score: 5, description: 'Unstructured, scattered, PII-locked' },
    ],
  },
  {
    id: 'ground_truth',
    label: 'Ground-Truth Labels',
    weight: 1,
    anchors: [
      { score: 1, description: 'Existing labeled set 1000+ cases' },
      { score: 3, description: 'Some labels, needs cleanup' },
      { score: 5, description: 'None; have to build the labeling process' },
    ],
  },
  {
    id: 'error_tolerance',
    label: 'Error Tolerance',
    weight: 1,
    anchors: [
      { score: 1, description: 'Symmetric, errors auto-detected, low cost' },
      { score: 3, description: 'Some asymmetry, manageable' },
      { score: 5, description: 'Asymmetric high-cost (regulatory, life-safety)' },
    ],
  },
  {
    id: 'stakeholder_readiness',
    label: 'Stakeholder Readiness',
    weight: 1,
    anchors: [
      { score: 1, description: 'Exec sponsor + operator + technical counterpart all named' },
      { score: 3, description: '2 of 3 present' },
      { score: 5, description: '< 2 of 3 present' },
    ],
  },
  {
    id: 'strategic_visibility',
    label: 'Strategic Visibility',
    weight: 1,
    anchors: [
      { score: 1, description: 'Operational improvement only' },
      { score: 3, description: 'Cited in roadmap' },
      { score: 5, description: 'Named in C-suite or board narrative' },
    ],
  },
  {
    id: 'reusability',
    label: 'Reusability',
    weight: 2,
    anchors: [
      { score: 1, description: 'One-off engagement' },
      { score: 3, description: 'Pattern repeats in 2–3 other engagements' },
      { score: 5, description: 'Vertical IP — pattern repeats across customer portfolio' },
    ],
  },
]

export const MAX_RUBRIC_SCORE = rubricDimensions.reduce((sum, d) => sum + 5 * d.weight, 0)
