import { Info } from 'lucide-react'
import { rubricDimensions, MAX_RUBRIC_SCORE } from '../../data/rubric'
import type { RubricDimension } from '../../data/rubric'

interface Props {
  scores: Record<string, number>
  setScores: (scores: Record<string, number>) => void
}

// For opportunity dims: 1=weak,3=ok,5=strong → green at 5
// For risk dims: 1=safe,3=caution,5=danger → red at 5
function getAnchorStyle(score: 1 | 3 | 5, category: 'opportunity' | 'risk', selected: boolean) {
  if (!selected) return {
    card: 'border-border theme-panel hover:border-slate-400 cursor-pointer',
    label: 'theme-muted',
    badge: 'theme-surface theme-muted border-border',
  }
  if (category === 'opportunity') {
    const styles = {
      1: { card: 'border-stop/60 bg-stop/8 cursor-pointer', label: 'text-stop', badge: 'bg-stop/20 text-stop border-stop/40' },
      3: { card: 'border-caution/60 bg-caution/8 cursor-pointer', label: 'text-caution', badge: 'bg-caution/20 text-caution border-caution/40' },
      5: { card: 'border-go/60 bg-go/8 cursor-pointer', label: 'text-go', badge: 'bg-go/20 text-go border-go/40' },
    }
    return styles[score]
  } else {
    // risk: high score = bad
    const styles = {
      1: { card: 'border-go/60 bg-go/8 cursor-pointer', label: 'text-go', badge: 'bg-go/20 text-go border-go/40' },
      3: { card: 'border-caution/60 bg-caution/8 cursor-pointer', label: 'text-caution', badge: 'bg-caution/20 text-caution border-caution/40' },
      5: { card: 'border-stop/60 bg-stop/8 cursor-pointer', label: 'text-stop', badge: 'bg-stop/20 text-stop border-stop/40' },
    }
    return styles[score]
  }
}

function getSegmentColor(score: number, category: 'opportunity' | 'risk'): string {
  if (score === 0) return '#1e2d45'
  if (category === 'opportunity') {
    if (score <= 2) return '#ef4444'
    if (score <= 3) return '#f59e0b'
    return '#22c55e'
  } else {
    if (score >= 4) return '#ef4444'
    if (score >= 3) return '#f59e0b'
    return '#22c55e'
  }
}

function getGateVerdict(pct: number): { label: string; color: string; bg: string; border: string; detail: string } {
  if (pct >= 70) return {
    label: 'GO',
    color: 'text-go', bg: 'bg-go/10', border: 'border-go/40',
    detail: 'Economics and readiness clear the FDE-time bar. Proceed to scoping.',
  }
  if (pct >= 45) return {
    label: 'CONDITIONAL',
    color: 'text-caution', bg: 'bg-caution/10', border: 'border-caution/40',
    detail: 'Viable path exists but key dimensions need resolution before build begins.',
  }
  return {
    label: 'PAUSE',
    color: 'text-stop', bg: 'bg-stop/10', border: 'border-stop/40',
    detail: 'Use case does not clear the minimum bar. COTS, RPA, or customer-owned build may be the right answer.',
  }
}

export function RubricTab({ scores, setScores }: Props) {
  const setScore = (id: string, value: number) => {
    setScores({ ...scores, [id]: value })
  }

  const total = rubricDimensions.reduce((sum, d) => sum + (scores[d.id] || 0) * d.weight, 0)
  const pct = Math.round((total / MAX_RUBRIC_SCORE) * 100)
  const verdict = getGateVerdict(pct)
  const scoredCount = rubricDimensions.filter(d => scores[d.id] > 0).length

  const weakOpportunities = rubricDimensions.filter(d => d.category === 'opportunity' && (scores[d.id] || 0) <= 2 && scores[d.id] > 0)
  const highRisks = rubricDimensions.filter(d => d.category === 'risk' && (scores[d.id] || 0) >= 4)

  return (
    <div className="space-y-6">

      {/* ── Top scoreboard ── */}
      <div className="theme-panel border theme-border rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold theme-text">High Value / High Impact Rubric</h2>
            <p className="text-sm theme-muted mt-1">
              Score each dimension by selecting the description that best matches the customer.
              {scoredCount < rubricDimensions.length && (
                <span className="text-caution ml-1">({rubricDimensions.length - scoredCount} unscored)</span>
              )}
            </p>
          </div>

          {/* Verdict pill + score */}
          <div className={`flex items-center gap-4 px-5 py-3 rounded-xl border ${verdict.bg} ${verdict.border} shrink-0`}>
            <div className="text-right">
              <div className={`font-mono font-bold text-4xl ${verdict.color}`}>{pct}<span className="text-2xl">%</span></div>
              <div className="text-xs theme-muted">{total} / {MAX_RUBRIC_SCORE} pts</div>
            </div>
            <div className={`text-sm font-mono font-bold tracking-widest px-3 py-1.5 rounded-lg border ${verdict.color} ${verdict.bg} ${verdict.border}`}>
              {verdict.label}
            </div>
          </div>
        </div>

        {/* Visual segment bar — one block per dimension */}
        <div className="mb-3">
          <div className="flex gap-1 h-3 rounded-full overflow-hidden">
            {rubricDimensions.map(d => {
              const score = scores[d.id] || 0
              const color = getSegmentColor(score, d.category)
              const widthPct = (d.weight / rubricDimensions.reduce((s, x) => s + x.weight, 0)) * 100
              return (
                <div
                  key={d.id}
                  title={`${d.label}: ${score}/5`}
                  className="rounded-sm transition-all duration-300"
                  style={{ width: `${widthPct}%`, backgroundColor: color }}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-xs theme-muted mt-1.5">
            <span>Opportunity dimensions (green = strong)</span>
            <span>Risk dimensions (red = high risk)</span>
          </div>
        </div>

        {/* Threshold markers */}
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-go" />
            <span className="theme-muted">≥ 70% → GO</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-caution" />
            <span className="theme-muted">45–69% → CONDITIONAL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-stop" />
            <span className="theme-muted">&lt; 45% → PAUSE</span>
          </div>
        </div>
      </div>

      {/* ── Flags: weak opps + high risks ── */}
      {(weakOpportunities.length > 0 || highRisks.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {weakOpportunities.length > 0 && (
            <div className="bg-caution/5 border border-caution/30 rounded-xl p-4">
              <div className="text-xs font-semibold text-caution uppercase tracking-wider mb-2">Weak Opportunities</div>
              <div className="space-y-1">
                {weakOpportunities.map(d => (
                  <div key={d.id} className="flex items-center justify-between text-sm">
                    <span className="theme-dim">{d.label}</span>
                    <span className="font-mono text-caution">{scores[d.id]}/5</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {highRisks.length > 0 && (
            <div className="bg-stop/5 border border-stop/30 rounded-xl p-4">
              <div className="text-xs font-semibold text-stop uppercase tracking-wider mb-2">High Risk Flags</div>
              <div className="space-y-1">
                {highRisks.map(d => (
                  <div key={d.id} className="flex items-center justify-between text-sm">
                    <span className="theme-dim">{d.label}</span>
                    <span className="font-mono text-stop">{scores[d.id]}/5 ⚠</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Opportunity dimensions ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-go" />
          <h3 className="text-sm font-semibold theme-text uppercase tracking-wider">Opportunity Dimensions</h3>
          <span className="text-xs theme-muted">Higher = more valuable</span>
        </div>
        <div className="space-y-3">
          {rubricDimensions.filter(d => d.category === 'opportunity').map(dim => (
            <DimensionCard key={dim.id} dim={dim} score={scores[dim.id] || 0} setScore={setScore} />
          ))}
        </div>
      </div>

      {/* ── Risk dimensions ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-stop" />
          <h3 className="text-sm font-semibold theme-text uppercase tracking-wider">Risk Dimensions</h3>
          <span className="text-xs theme-muted">Higher = more challenging — requires mitigation</span>
        </div>
        <div className="space-y-3">
          {rubricDimensions.filter(d => d.category === 'risk').map(dim => (
            <DimensionCard key={dim.id} dim={dim} score={scores[dim.id] || 0} setScore={setScore} />
          ))}
        </div>
      </div>

      {/* ── Verdict detail ── */}
      <div className={`rounded-xl border p-5 ${verdict.bg} ${verdict.border}`}>
        <div className="flex items-start gap-3">
          <div className={`font-mono font-bold text-sm px-2 py-1 rounded border ${verdict.color} ${verdict.bg} ${verdict.border} shrink-0`}>
            {verdict.label}
          </div>
          <p className={`text-sm ${verdict.color} leading-relaxed`}>{verdict.detail}</p>
        </div>
        {highRisks.length > 0 && (
          <p className="text-xs text-stop mt-3">
            ⚠ {highRisks.map(d => d.label).join(', ')} scored high-risk — human-in-the-loop scoping required before autonomous build.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Individual dimension card ──
function DimensionCard({
  dim,
  score,
  setScore,
}: {
  dim: RubricDimension
  score: number
  setScore: (id: string, v: number) => void
}) {
  const weightedScore = score * dim.weight

  return (
    <div className="theme-panel border theme-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b theme-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold theme-text">{dim.label}</span>
          {dim.weight > 1 && (
            <span className="text-xs font-mono font-bold text-accent bg-accent/10 border border-accent/30 px-1.5 py-0.5 rounded">
              {dim.weight}× WEIGHT
            </span>
          )}
          <div className="group relative">
            <Info size={13} className="theme-muted cursor-help" />
            <div className="absolute left-0 top-5 z-10 w-56 p-2.5 bg-panel border theme-border rounded-lg text-xs theme-muted shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {dim.why}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {score > 0 && (
            <>
              <div className="h-1.5 w-20 theme-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(score / 5) * 100}%`,
                    backgroundColor: getSegmentColor(score, dim.category),
                  }}
                />
              </div>
              <span className="font-mono font-bold text-sm" style={{ color: getSegmentColor(score, dim.category) }}>
                {score}/5
                {dim.weight > 1 && <span className="text-xs text-muted"> ({weightedScore}pts)</span>}
              </span>
            </>
          )}
          {score === 0 && <span className="text-xs theme-muted italic">not scored</span>}
        </div>
      </div>

      {/* Anchor cards — the actual input */}
      <div className="grid grid-cols-3 gap-2 p-3">
        {dim.anchors.map(anchor => {
          const selected = score === anchor.score
          const style = getAnchorStyle(anchor.score, dim.category, selected)
          return (
            <button
              key={anchor.score}
              onClick={() => setScore(dim.id, score === anchor.score ? 0 : anchor.score)}
              className={`text-left p-3 rounded-xl border transition-all ${style.card}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-bold uppercase tracking-wide ${style.label}`}>
                  {anchor.label}
                </span>
                <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${style.badge}`}>
                  {anchor.score}
                </span>
              </div>
              <p className="text-xs theme-dim leading-relaxed">{anchor.description}</p>
            </button>
          )
        })}
      </div>

      {/* Intermediate scores */}
      {score > 0 && (
        <div className="flex items-center gap-2 px-3 pb-3">
          <span className="text-xs theme-muted">Fine-tune:</span>
          {[1, 2, 3, 4, 5].map(v => (
            <button
              key={v}
              onClick={() => setScore(dim.id, v)}
              className={`w-7 h-7 rounded-lg text-xs font-mono font-bold border transition-all ${
                score === v
                  ? 'border-accent bg-accent/20 text-accent'
                  : 'border-border theme-surface theme-muted hover:border-slate-400'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
