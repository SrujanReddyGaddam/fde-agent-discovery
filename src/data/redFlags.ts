export interface RedFlag {
  id: string
  flag: string
  translation: string
  severity: 'critical' | 'high' | 'medium'
}

export const redFlags: RedFlag[] = [
  {
    id: 'RF01',
    flag: 'No volume data. "We process a lot of these."',
    translation: 'No denominator for ROI. Pause until they can produce a number.',
    severity: 'critical',
  },
  {
    id: 'RF02',
    flag: 'No labor cost saved or no quantified value.',
    translation: 'Nobody has done the math. Project won\'t survive funding review.',
    severity: 'critical',
  },
  {
    id: 'RF03',
    flag: 'No executive sponsor. Innovation-team driven, no operator.',
    translation: 'No air cover. Project will hit the political brick wall the moment it touches a P&L owner.',
    severity: 'critical',
  },
  {
    id: 'RF04',
    flag: 'No operational owner. Nobody owns the team whose job changes.',
    translation: 'No adoption path. Even a successful v1 won\'t be picked up.',
    severity: 'critical',
  },
  {
    id: 'RF05',
    flag: 'No data access plan. Legal / compliance not engaged.',
    translation: 'Data access will block production launch. Engage compliance in week 1, not week 10.',
    severity: 'critical',
  },
  {
    id: 'RF06',
    flag: 'No measured human error rate. "We don\'t really measure that."',
    translation: 'Without a measured baseline, there is no AI success bar.',
    severity: 'high',
  },
  {
    id: 'RF07',
    flag: 'No COTS comparison. They didn\'t look.',
    translation: 'You may be building what\'s already on the shelf.',
    severity: 'high',
  },
  {
    id: 'RF08',
    flag: 'Asymmetric high-cost errors with no mitigation strategy.',
    translation: 'Risk-adjusted scope is much smaller than they think. Build for human-in-the-loop from v1.',
    severity: 'critical',
  },
  {
    id: 'RF09',
    flag: 'Multiple decisions disguised as one use case.',
    translation: 'They have 3–5 distinct decisions bundled into one ask. Force them to pick the highest-value one.',
    severity: 'high',
  },
  {
    id: 'RF10',
    flag: '"It\'s all in our team\'s heads." No rule book exists.',
    translation: 'The first deliverable will be writing the rule book. Add 4–6 weeks before AI work begins.',
    severity: 'high',
  },
  {
    id: 'RF11',
    flag: 'The data is changing. Process recently overhauled or system migration in flight.',
    translation: 'Historical data is stale; eval will lie. Build on stable ground or wait one quarter.',
    severity: 'high',
  },
  {
    id: 'RF12',
    flag: 'Distributed work with no central process. "Different teams do it differently."',
    translation: 'Process problem, not AI problem. Standardize first, automate second.',
    severity: 'high',
  },
  {
    id: 'RF13',
    flag: 'No FDE-side technical counterpart available.',
    translation: 'Project becomes a solo FDE indefinite engagement. Don\'t accept without one.',
    severity: 'critical',
  },
  {
    id: 'RF14',
    flag: '"ASAP" timeline with no real forcing function.',
    translation: 'No urgency = drift. Project will lose to whatever has a real deadline.',
    severity: 'medium',
  },
  {
    id: 'RF15',
    flag: '"Legal will look at the data once we have something to show."',
    translation: 'Data access will block production launch. Engage compliance in week 2, not week 10.',
    severity: 'critical',
  },
  {
    id: 'RF16',
    flag: '"We\'ll figure out who owns it post-launch."',
    translation: 'Nobody owns it. The project will rot. Bake a named owner into the v1 statement of work.',
    severity: 'high',
  },
  {
    id: 'RF17',
    flag: '"Our error rate is fine." Without a measured human baseline.',
    translation: 'Nobody measures it. You cannot define AI success against an unmeasured baseline.',
    severity: 'high',
  },
  {
    id: 'RF18',
    flag: '"We tried something like this before, but…"',
    translation: 'Most useful sentence in any discovery call. Get the full post-mortem before scoping.',
    severity: 'high',
  },
  {
    id: 'RF19',
    flag: '"We just need a quick demo / POC."',
    translation: 'The v1 is the v3 in their mind. Set expectations now: 60–90 days of post-demo tuning before production.',
    severity: 'medium',
  },
  {
    id: 'RF20',
    flag: 'LLM API spend at scale exceeds projected labor savings.',
    translation: 'Token economics kill this use case. Compress (smaller model, fewer tokens, batch) or disqualify.',
    severity: 'critical',
  },
  {
    id: 'RF21',
    flag: 'Customer requires on-prem / air-gapped inference.',
    translation: 'Materially changes architecture, model selection, and shipping timeline. Trigger the architecture conversation in week 1.',
    severity: 'high',
  },
  {
    id: 'RF22',
    flag: 'They\'ve tried this before and it failed.',
    translation: 'Get the post-mortem before scoping v2. Same constraints often still apply.',
    severity: 'high',
  },
]
