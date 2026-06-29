import { useState } from 'react'
import { Sparkles, Loader2, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import { scorecardDomains } from '../../data/scorecard'
import { TierBadge } from '../ui/TierBadge'
import { generateGapAnalysis, type GapAnalysis } from '../../lib/aiGapAnalysis'
import type { LLMConfig } from '../../lib/llmClient'

interface Props {
  scores: Record<string, number>
  setScores: (scores: Record<string, number>) => void
  notes: Record<string, string>
  setNotes: (notes: Record<string, string>) => void
  llmConfig: LLMConfig
}

const DOMAIN_COLORS = ['text-blue-400', 'text-purple-400', 'text-emerald-400', 'text-orange-400']
const DOMAIN_BORDERS = ['border-blue-500/30', 'border-purple-500/30', 'border-emerald-500/30', 'border-orange-500/30']

export function ScorecardTab({ scores, setScores, notes, setNotes, llmConfig }: Props) {
  const [gapLoading, setGapLoading] = useState<string | null>(null)
  const [gapResults, setGapResults] = useState<Record<string, GapAnalysis>>({})
  const [gapOpen, setGapOpen] = useState<Record<string, boolean>>({})

  const isConfigured = llmConfig.provider === 'anthropic'
    ? !!llmConfig.anthropicKey
    : !!llmConfig.localBaseUrl

  const runGapAnalysis = async (domainId: string) => {
    const score = scores[domainId] || 0
    if (score === 0) return
    setGapLoading(domainId)
    try {
      const result = await generateGapAnalysis(llmConfig, domainId, score, notes[domainId] || '')
      setGapResults(prev => ({ ...prev, [domainId]: result }))
      setGapOpen(prev => ({ ...prev, [domainId]: true }))
    } catch (e: any) {
      // fail silently — gap panel just won't appear
    } finally {
      setGapLoading(null)
    }
  }

  const setScore = (id: string, value: number) => {
    setScores({ ...scores, [id]: Math.max(0, Math.min(25, value)) })
  }
  const setNote = (id: string, value: string) => {
    setNotes({ ...notes, [id]: value })
  }

  const allScored = scorecardDomains.every(d => scores[d.id] > 0)
  const totalAvg = allScored
    ? Math.round(scorecardDomains.reduce((sum, d) => sum + (scores[d.id] || 0), 0) / scorecardDomains.length)
    : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold theme-text">FDE Agentic Scorecard</h2>
          <p className="text-xs text-muted mt-1">Score 1–25 per domain. Conservative scores are more useful than generous ones.</p>
        </div>
        {totalAvg !== null && (
          <div className="text-right">
            <div className="font-mono font-bold text-3xl theme-text">{totalAvg}<span className="text-muted text-base">/25</span></div>
            <div className="text-xs text-muted">avg across domains</div>
          </div>
        )}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {scorecardDomains.map((domain, i) => {
          const score = scores[domain.id] || 0
          return (
            <div key={domain.id} className={`theme-panel border rounded-xl p-3 text-center ${DOMAIN_BORDERS[i]}`}>
              <div className={`text-xs font-mono font-semibold mb-1 ${DOMAIN_COLORS[i]}`}>{domain.id}</div>
              <div className="font-mono font-bold text-2xl theme-text">{score || '—'}</div>
              <div className="text-xs text-muted mb-2">/25</div>
              <TierBadge score={score} />
            </div>
          )
        })}
      </div>

      {/* Tier reference */}
      <div className="grid grid-cols-4 gap-2 mb-6 text-xs">
        {[
          { range: '1–7', label: 'Below Baseline', color: 'text-stop bg-stop/10 border-stop/30' },
          { range: '8–14', label: 'Baseline', color: 'text-caution bg-caution/10 border-caution/30' },
          { range: '15–20', label: 'Strong', color: 'text-go bg-go/10 border-go/30' },
          { range: '21–25', label: 'Elite', color: 'text-accent bg-accent/10 border-accent/30' },
        ].map(t => (
          <div key={t.label} className={`text-center p-2 rounded-lg border font-mono ${t.color}`}>
            <div className="font-bold">{t.range}</div>
            <div>{t.label}</div>
          </div>
        ))}
      </div>

      {/* Domain detail cards */}
      <div className="space-y-4">
        {scorecardDomains.map((domain, i) => {
          const score = scores[domain.id] || 0
          const tier = domain.tiers.find(t => score >= t.range[0] && score <= t.range[1])

          return (
            <div key={domain.id} className={`theme-panel border rounded-xl overflow-hidden ${DOMAIN_BORDERS[i]}`}>
              <div className="px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold text-base ${DOMAIN_COLORS[i]}`}>{domain.label}</span>
                  <div className="flex items-center gap-3">
                    <TierBadge score={score} />
                    <span className="font-mono font-bold text-2xl theme-text">{score || '—'}</span>
                    <span className="text-muted text-sm">/25</span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4">
                {/* Score slider */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted mb-1.5">
                    <span>Below Baseline</span>
                    <span>Baseline</span>
                    <span>Strong</span>
                    <span>Elite</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min={0}
                      max={25}
                      value={score}
                      onChange={e => setScore(domain.id, parseInt(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: score === 0
                          ? '#1e2d45'
                          : `linear-gradient(to right, ${
                              score <= 7 ? '#ef4444' : score <= 14 ? '#f59e0b' : score <= 20 ? '#22c55e' : '#3B82F6'
                            } ${(score / 25) * 100}%, #1e2d45 ${(score / 25) * 100}%)`,
                      }}
                    />
                    <div className="flex justify-between text-xs text-border mt-1">
                      {[0, 5, 10, 15, 20, 25].map(n => (
                        <span key={n} className="font-mono">{n}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Assessment questions */}
                <div className="mb-4 space-y-1">
                  <div className="text-xs font-semibold theme-muted uppercase tracking-wider mb-2">Assessment Questions</div>
                  {domain.questions.map((q, qi) => (
                    <div key={qi} className="flex gap-2 text-xs text-muted">
                      <span className="font-mono text-accent shrink-0">{qi + 1}.</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>

                {/* Current tier description */}
                {tier && (
                  <div className="mb-4 p-3 theme-surface border theme-border rounded-lg text-xs theme-dim">
                    <span className="font-semibold theme-text">{tier.label}: </span>
                    {tier.description}
                  </div>
                )}

                {/* Evidence note */}
                <div>
                  <label className="text-xs font-semibold theme-muted uppercase tracking-wider block mb-1.5">
                    Evidence Note (2–3 sentences)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Why did you choose this score? What's the specific evidence?"
                    value={notes[domain.id] || ''}
                    onChange={e => setNote(domain.id, e.target.value)}
                    className="w-full theme-input theme-text border theme-border rounded-lg px-3 py-2 text-sm placeholder:text-slate-400 resize-none focus:border-accent/60 transition-colors"
                  />
                </div>

                {/* Gap analysis */}
                {isConfigured && score > 0 && score < 21 && (
                  <div>
                    <button
                      onClick={() => gapResults[domain.id]
                        ? setGapOpen(prev => ({ ...prev, [domain.id]: !prev[domain.id] }))
                        : runGapAnalysis(domain.id)
                      }
                      disabled={gapLoading === domain.id}
                      className="flex items-center gap-1.5 text-xs text-accent hover:text-blue-300 transition-colors disabled:opacity-50"
                    >
                      {gapLoading === domain.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Sparkles size={12} />
                      }
                      {gapLoading === domain.id
                        ? 'Analysing gap...'
                        : gapResults[domain.id]
                        ? (gapOpen[domain.id] ? 'Hide gap analysis' : 'Show gap analysis')
                        : 'What moves this to the next tier?'
                      }
                      {gapResults[domain.id] && (
                        gapOpen[domain.id] ? <ChevronUp size={11} /> : <ChevronDown size={11} />
                      )}
                    </button>

                    {gapResults[domain.id] && gapOpen[domain.id] && (
                      <div className="mt-3 p-4 bg-accent/5 border border-accent/20 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold theme-muted">
                          <span className="text-stop">{gapResults[domain.id].currentTier}</span>
                          <ArrowRight size={12} />
                          <span className="text-go">{gapResults[domain.id].targetTier}</span>
                          <span className="ml-auto text-accent">{gapResults[domain.id].timeframe}</span>
                        </div>
                        {gapResults[domain.id].actions.map((action, ai) => (
                          <div key={ai} className="flex gap-2.5">
                            <span className="font-mono text-xs text-accent shrink-0 mt-0.5">{ai + 1}.</span>
                            <div>
                              <div className="text-sm font-semibold theme-text">{action.title}</div>
                              <div className="text-xs theme-muted mt-0.5 leading-relaxed">{action.detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
