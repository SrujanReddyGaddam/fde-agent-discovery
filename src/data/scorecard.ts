export interface ScorecardDomain {
  id: string
  label: string
  shortLabel: string
  questions: string[]
  tiers: { range: [number, number]; label: string; description: string }[]
}

export const scorecardDomains: ScorecardDomain[] = [
  {
    id: 'D1',
    label: 'Domain 1: Product Sense',
    shortLabel: 'Product Sense',
    questions: [
      'Right problem? How was this use case selected, and is there evidence it ranks above alternatives?',
      'Right experience? Does the agent disrupt existing workflow, and can users see its reasoning, override decisions, and build trust incrementally?',
      'Proving value? Can you state pre-deployment baseline metrics, expected ROI, and fully loaded operating cost?',
      'Strategically aligned? Is this a strategic priority for the customer, or just an approved project?',
      'Actually adopted? What % of target users are using the system on a sustained basis, and what barriers have been removed?',
    ],
    tiers: [
      {
        range: [1, 7],
        label: 'Below Baseline',
        description: 'Use case accepted without validation. No baseline or success metrics exist.',
      },
      {
        range: [8, 14],
        label: 'Baseline',
        description: 'Use case validated through user research. Baseline metrics defined, executive sponsor engaged.',
      },
      {
        range: [15, 20],
        label: 'Strong',
        description: 'Discovery uncovered higher-value opportunities. UX metrics reviewed monthly. Segmented ROI dashboards.',
      },
      {
        range: [21, 25],
        label: 'Elite',
        description: 'Use case reshapes customer\'s business model. Unit economics drive investment. System growing organically with network effects.',
      },
    ],
  },
  {
    id: 'D2',
    label: 'Domain 2: Agentic Architecture',
    shortLabel: 'Architecture',
    questions: [
      'Orchestration: When a task requires multiple agents, how does the system decide which to invoke, in what order, and what happens when one produces bad output?',
      'LLM usage: Are models selected intentionally per task? Are prompts versioned, tested, and designed with a consistent methodology?',
      'Context and retrieval: Is every agent decision grounded in the right information, without exceeding context limits or introducing retrieval noise?',
      'Evaluations: If a new model version degraded 5% of production cases, how quickly would you detect it and precisely characterize what went wrong?',
      'Guardrails: What prevents harmful, off-topic, or policy-violating outputs — and how do you know those protections still work as the system evolves?',
    ],
    tiers: [
      {
        range: [1, 7],
        label: 'Below Baseline',
        description: 'Single prompt or rigid sequence. No conditional logic. No eval suite. No guardrails beyond base model behavior.',
      },
      {
        range: [8, 14],
        label: 'Baseline',
        description: 'Agents have defined roles. Prompts versioned. RAG pipeline with intentional chunking. Eval suite covers top 20–30 scenarios.',
      },
      {
        range: [15, 20],
        label: 'Strong',
        description: 'Orchestration dynamically composes workflows. Multiple retrieval strategies. Multi-layered evals with drift detection.',
      },
      {
        range: [21, 25],
        label: 'Elite',
        description: 'System reasons about its own workflow composition. New model releases benchmarked within days. Governance as policy-as-code.',
      },
    ],
  },
  {
    id: 'D3',
    label: 'Domain 3: Production-Grade Systems',
    shortLabel: 'Production',
    questions: [
      'Reliability: If the primary model provider went down at 2 AM, what would happen to in-flight tasks, and how long before recovery?',
      'Observability: If a user reported a wrong answer right now, how long to reconstruct exactly what the agent saw, retrieved, reasoned, and decided?',
      'Degradation: When the agent encounters a task beyond its competence, does it recognize that fact — and does the human who receives the escalation start at 60% done or at zero?',
      'Compliance: If a regulator asked "why did the system make this decision?" about an action from 3 months ago, could you answer within 24 hours?',
      'Iteration speed: How many days from "fix is ready" to "safely running in production," and how fast could you ship an urgent fix?',
    ],
    tiers: [
      {
        range: [1, 7],
        label: 'Below Baseline',
        description: 'Requests fail silently or loop. No trace correlation. No escalation path. Manual deployments with slow rollback.',
      },
      {
        range: [8, 14],
        label: 'Baseline',
        description: 'Structured retries. Every execution has a unique trace ID. CI/CD pipeline with eval gates, rollback within 15 minutes.',
      },
      {
        range: [15, 20],
        label: 'Strong',
        description: 'Full execution graphs with confidence signals. Deterministic replay. Immutable audit trails. Sub-30-minute evals.',
      },
      {
        range: [21, 25],
        label: 'Elite',
        description: 'Intelligent multi-model routing. Self-healing retrieval. System predicts escalation needs before processing. Compliance as policy-as-code.',
      },
    ],
  },
  {
    id: 'D4',
    label: 'Domain 4: Execution Leadership',
    shortLabel: 'Execution',
    questions: [
      'Program management: If someone asked right now for status of every workstream, top 3 risks, and next 2 milestones with confidence levels — how long to answer?',
      'Dependencies: Can you identify every external dependency that could delay the next milestone, who owns each, and the contingency plan if any slips?',
      'Resource & capacity: Do you know the actual availability of every key contributor, and can you identify where capacity constraints will force tradeoffs before they cause delays?',
      'Operating rhythm: Do your regular ceremonies consistently surface real problems and produce concrete actions?',
      'Risk management: What are the 3 most likely scenarios that could force a significant change to the current plan — and what would you do in the first 48 hours for each?',
    ],
    tiers: [
      {
        range: [1, 7],
        label: 'Below Baseline',
        description: 'No unified view. Dependencies discovered when they block. Meetings purely informational. Risk management reactive.',
      },
      {
        range: [8, 14],
        label: 'Baseline',
        description: 'Structured delivery plan with milestones and owners. Dependencies mapped. Risk register maintained with contingency plans.',
      },
      {
        range: [15, 20],
        label: 'Strong',
        description: 'Rolling forecasts. Mitigations begin before risks are reported. Capacity forecast against roadmap with tradeoffs escalated.',
      },
      {
        range: [21, 25],
        label: 'Elite',
        description: 'Velocity measured to calibrate estimates. Program front-loads riskiest dependencies. Leading indicators as early warning signals.',
      },
    ],
  },
]
