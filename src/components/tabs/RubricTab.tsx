import { rubricDimensions, MAX_RUBRIC_SCORE } from '../../data/rubric'

interface Props {
  scores: Record<string, number>
  setScores: (scores: Record<string, number>) => void
}

function getScoreColor(score: number) {
  if (score === 0) return 'text-muted'
  if (score <= 2) return 'text-go'
  if (score === 3) return 'text-caution'
  return 'text-stop'
}

function getGateColor(pct: number) {
  if (pct >= 70) return { label: 'GO', color: 'text-go', bg: 'bg-go/10 border-go/30' }
  if (pct >= 45) return { label: 'CONDITIONAL', color: 'text-caution', bg: 'bg-caution/10 border-caution/30' }
  return { label: 'PAUSE / NO-GO', color: 'text-stop', bg: 'bg-stop/10 border-stop/30' }
}

export function RubricTab({ scores, setScores }: Props) {
  const setScore = (id: string, value: number) => {
    setScores({ ...scores, [id]: value })
  }

  const total = rubricDimensions.reduce((sum, d) => sum + (scores[d.id] || 0) * d.weight, 0)
  const pct = Math.round((total / MAX_RUBRIC_SCORE) * 100)
  const gate = getGateColor(pct)

  return (
    <div>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 rounded-xl border mb-6 ${gate.bg}`}>
        <div>
          <h2 className="text-xl font-semibold theme-text">High Value / High Impact Rubric</h2>
          <p className="text-xs text-muted mt-1">Score 1–5 per dimension. Reusability is 2× weighted. Most ≥3, at least two ≥4.</p>
        </div>
        <div className="text-right">
          <div className={`font-mono font-bold text-3xl ${gate.color}`}>{pct}%</div>
          <div className={`text-xs font-mono font-semibold ${gate.color}`}>{gate.label}</div>
          <div className="text-xs text-muted">{total}/{MAX_RUBRIC_SCORE} pts</div>
        </div>
      </div>

      <div className="space-y-3">
        {rubricDimensions.map(dim => {
          const score = scores[dim.id] || 0

          return (
            <div key={dim.id} className="theme-panel border theme-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium theme-text">{dim.label}</span>
                  {dim.weight > 1 && (
                    <span className="text-xs font-mono text-accent bg-accent/10 border border-accent/30 px-1.5 py-0.5 rounded">
                      {dim.weight}× weight
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono font-bold text-lg ${getScoreColor(score)}`}>
                    {score > 0 ? score : '—'}
                  </span>
                  <span className="text-xs text-muted">/5</span>
                </div>
              </div>

              {/* Score buttons */}
              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map(val => (
                  <button
                    key={val}
                    onClick={() => setScore(dim.id, val)}
                    className={`flex-1 h-9 rounded-lg text-sm font-mono font-bold transition-all border ${
                      score === val
                        ? val <= 2
                          ? 'bg-go/20 border-go text-go'
                          : val === 3
                          ? 'bg-caution/20 border-caution text-caution'
                          : 'bg-stop/20 border-stop text-stop'
                        : 'theme-surface border-border text-muted hover:border-slate-500 hover:theme-dim'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>

              {/* Anchors */}
              <div className="grid grid-cols-3 gap-2">
                {dim.anchors.map(a => (
                  <div
                    key={a.score}
                    className={`text-xs p-2 rounded-lg border transition-all ${
                      score === a.score
                        ? 'theme-panel border-accent/40 theme-text'
                        : 'border-border/50 text-muted'
                    }`}
                  >
                    <span className="font-mono text-accent">{a.score}:</span> {a.description}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
