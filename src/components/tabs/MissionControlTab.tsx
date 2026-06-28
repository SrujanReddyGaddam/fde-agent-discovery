import { useMemo } from 'react'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts'
import { CheckCircle2, XCircle, HelpCircle, Lock, AlertTriangle, TrendingUp } from 'lucide-react'
import { evaluateGates, getGateSummary } from '../../lib/gateEvaluator'
import { scorecardDomains } from '../../data/scorecard'
import { rubricDimensions, MAX_RUBRIC_SCORE } from '../../data/rubric'
import { redFlags } from '../../data/redFlags'
import { GateBadge } from '../ui/GateBadge'
import type { VerdictResult } from '../../lib/aiVerdict'

interface Props {
  meta: { customerName: string; date: string; fde: string; useCaseSummary: string }
  answers: Record<string, string>
  triggeredFlags: string[]
  rubricScores: Record<string, number>
  scorecardScores: Record<string, number>
  verdict: VerdictResult | null
}

const STATUS_CONFIG = {
  pass: { icon: CheckCircle2, color: 'text-go', bg: 'bg-go/10', border: 'border-go/40', label: 'PASS' },
  fail: { icon: XCircle, color: 'text-stop', bg: 'bg-stop/10', border: 'border-stop/40', label: 'FAIL' },
  unknown: { icon: HelpCircle, color: 'text-caution', bg: 'bg-caution/10', border: 'border-caution/40', label: 'UNKNOWN' },
  locked: { icon: Lock, color: 'text-muted', bg: 'bg-surface', border: 'border-border', label: 'LOCKED' },
}

const DOMAIN_COLORS = ['#3B82F6', '#a855f7', '#22c55e', '#f59e0b']

function getTier(score: number) {
  if (score === 0) return { label: '—', color: '#6b7280' }
  if (score <= 7) return { label: 'Below Baseline', color: '#ef4444' }
  if (score <= 14) return { label: 'Baseline', color: '#f59e0b' }
  if (score <= 20) return { label: 'Strong', color: '#22c55e' }
  return { label: 'Elite', color: '#3B82F6' }
}

export function MissionControlTab({ meta, answers, triggeredFlags, rubricScores, scorecardScores, verdict }: Props) {
  const gateResults = useMemo(
    () => evaluateGates(answers, triggeredFlags, rubricScores),
    [answers, triggeredFlags, rubricScores]
  )
  const gateSummary = useMemo(() => getGateSummary(gateResults), [gateResults])

  const radarData = scorecardDomains.map((d, i) => ({
    domain: d.shortLabel,
    score: scorecardScores[d.id] || 0,
    max: 25,
    color: DOMAIN_COLORS[i],
  }))

  const rubricTotal = rubricDimensions.reduce((sum, d) => sum + (rubricScores[d.id] || 0) * d.weight, 0)
  const rubricPct = Math.round((rubricTotal / MAX_RUBRIC_SCORE) * 100)
  const criticalFlags = triggeredFlags.filter(id => redFlags.find(f => f.id === id)?.severity === 'critical').length
  const avgScorecard = scorecardDomains.reduce((sum, d) => sum + (scorecardScores[d.id] || 0), 0) / scorecardDomains.length

  // Overall health score (composite)
  const healthPct = Math.round(
    (gateSummary.passed / 7) * 35 +
    (rubricPct / 100) * 30 +
    ((avgScorecard / 25) * 100) * 0.25 +
    (Math.max(0, 1 - triggeredFlags.length / 22) * 100) * 0.10
  )

  const healthColor = healthPct >= 70 ? '#22c55e' : healthPct >= 45 ? '#f59e0b' : '#ef4444'
  const healthLabel = healthPct >= 70 ? 'Strong Candidate' : healthPct >= 45 ? 'Needs Work' : 'Not Ready'

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Health score */}
        <div className="col-span-2 md:col-span-1 theme-panel border theme-border rounded-xl p-5 flex flex-col items-center justify-center text-center">
          <div className="text-xs theme-muted uppercase tracking-wider mb-2">Engagement Health</div>
          <div className="relative w-24 h-24 mb-2">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={healthColor} strokeWidth="10"
                strokeDasharray={`${healthPct * 2.51} 251`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
              <span className="font-mono font-bold text-2xl theme-text">{healthPct}</span>
              <span className="text-xs theme-muted">/ 100</span>
            </div>
          </div>
          <div className="text-sm font-semibold" style={{ color: healthColor }}>{healthLabel}</div>
          {meta.customerName && <div className="text-xs theme-muted mt-1 truncate max-w-full">{meta.customerName}</div>}
        </div>

        {/* Gate progress */}
        <div className="theme-panel border theme-border rounded-xl p-5 flex flex-col justify-between">
          <div className="text-xs theme-muted uppercase tracking-wider mb-3">7-Gate Progress</div>
          <div className="flex gap-1 mb-2">
            {gateResults.map(r => (
              <div
                key={r.gate.id}
                className="flex-1 h-2 rounded-full"
                style={{
                  backgroundColor:
                    r.status === 'pass' ? '#22c55e' :
                    r.status === 'fail' ? '#ef4444' :
                    r.status === 'unknown' ? '#f59e0b' : '#1e2d45',
                }}
              />
            ))}
          </div>
          <div className="flex gap-2 text-xs font-mono">
            <span className="text-go font-bold">{gateSummary.passed}✓</span>
            {gateSummary.failed > 0 && <span className="text-stop font-bold">{gateSummary.failed}✗</span>}
            {gateSummary.unknown > 0 && <span className="text-caution">{gateSummary.unknown}?</span>}
          </div>
          {gateSummary.stoppedAt && (
            <div className="text-xs text-stop mt-1">Stopped at Gate {gateSummary.stoppedAt}</div>
          )}
        </div>

        {/* Rubric */}
        <div className="theme-panel border theme-border rounded-xl p-5 flex flex-col justify-between">
          <div className="text-xs theme-muted uppercase tracking-wider mb-2">Impact Rubric</div>
          <div className="font-mono font-bold text-3xl theme-text">{rubricPct}<span className="text-muted text-lg">%</span></div>
          <div className="h-2 theme-surface rounded-full overflow-hidden mt-2">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${rubricPct}%`, backgroundColor: rubricPct >= 70 ? '#22c55e' : rubricPct >= 45 ? '#f59e0b' : '#ef4444' }}
            />
          </div>
          <div className="text-xs theme-muted mt-1">{rubricTotal}/{MAX_RUBRIC_SCORE} pts</div>
        </div>

        {/* Red flags */}
        <div className="theme-panel border theme-border rounded-xl p-5 flex flex-col justify-between">
          <div className="text-xs theme-muted uppercase tracking-wider mb-2">Red Flags</div>
          <div className="font-mono font-bold text-3xl" style={{ color: criticalFlags >= 2 ? '#ef4444' : triggeredFlags.length >= 3 ? '#f59e0b' : '#22c55e' }}>
            {triggeredFlags.length}<span className="text-muted text-lg">/22</span>
          </div>
          {criticalFlags > 0 && (
            <div className="flex items-center gap-1 text-xs text-stop mt-1">
              <AlertTriangle size={11} />
              {criticalFlags} critical
            </div>
          )}
          {verdict && (
            <div className="mt-2">
              <GateBadge gate={verdict.gate} />
            </div>
          )}
        </div>
      </div>

      {/* Main content: Gate flow + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 7-Gate Decision Flow */}
        <div className="theme-panel border theme-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b theme-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold theme-text">7-Gate Decision Flow</h3>
              <p className="text-xs theme-muted mt-0.5">Sequential qualification — earlier failures lock later gates</p>
            </div>
            {gateSummary.stoppedAt === null && gateSummary.unknown === 0 && (
              <span className="text-xs font-mono text-go bg-go/10 border border-go/30 px-2 py-0.5 rounded">ALL CLEAR</span>
            )}
          </div>

          <div className="p-4 space-y-2">
            {gateResults.map((result, idx) => {
              const config = STATUS_CONFIG[result.status]
              const Icon = config.icon
              const isLocked = result.status === 'locked'

              return (
                <div key={result.gate.id} className="relative">
                  {/* Connector line */}
                  {idx < gateResults.length - 1 && (
                    <div className={`absolute left-[22px] top-[42px] w-0.5 h-3 ${
                      result.status === 'pass' ? 'bg-go/40' : 'bg-border'
                    }`} />
                  )}

                  <div className={`flex gap-3 p-3 rounded-xl border transition-all ${config.bg} ${config.border} ${isLocked ? 'opacity-40' : ''}`}>
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        result.status === 'pass' ? 'border-go bg-go/20' :
                        result.status === 'fail' ? 'border-stop bg-stop/20' :
                        result.status === 'unknown' ? 'border-caution bg-caution/20' :
                        'border-border bg-border/20'
                      }`}>
                        <span className="font-mono text-[10px] font-bold" style={{
                          color: result.status === 'pass' ? '#22c55e' :
                                 result.status === 'fail' ? '#ef4444' :
                                 result.status === 'unknown' ? '#f59e0b' : '#6b7280'
                        }}>
                          {result.gate.id}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-semibold ${isLocked ? 'theme-muted' : 'theme-text'}`}>
                          {result.gate.label}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Icon size={14} className={config.color} />
                          <span className={`text-xs font-mono font-bold ${config.color}`}>{config.label}</span>
                        </div>
                      </div>

                      <p className="text-xs theme-muted mt-0.5">{result.gate.description}</p>

                      {!isLocked && (
                        <p className={`text-xs mt-1 italic ${
                          result.status === 'fail' ? 'text-stop' :
                          result.status === 'pass' ? 'text-go' :
                          'text-caution'
                        }`}>
                          {result.evidence}
                        </p>
                      )}

                      {result.status === 'fail' && (
                        <div className="mt-2 p-2 bg-stop/5 border border-stop/20 rounded-lg">
                          <p className="text-xs text-stop font-medium">Action: {result.gate.failAction}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Summary recommendation */}
            {gateSummary.recommendation && (
              <div className={`mt-3 p-3 rounded-xl border flex items-start gap-2 ${
                gateSummary.passed === 7
                  ? 'bg-go/10 border-go/30'
                  : gateSummary.failed > 0
                  ? 'bg-stop/10 border-stop/30'
                  : 'bg-caution/10 border-caution/30'
              }`}>
                <TrendingUp size={14} className={gateSummary.passed === 7 ? 'text-go mt-0.5' : gateSummary.failed > 0 ? 'text-stop mt-0.5' : 'text-caution mt-0.5'} />
                <p className={`text-xs font-medium ${gateSummary.passed === 7 ? 'text-go' : gateSummary.failed > 0 ? 'text-stop' : 'text-caution'}`}>
                  {gateSummary.recommendation}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Radar + Scorecard breakdown */}
        <div className="space-y-4">
          {/* Radar chart */}
          <div className="theme-panel border theme-border rounded-xl p-5">
            <h3 className="font-semibold theme-text mb-1">Scorecard Radar</h3>
            <p className="text-xs theme-muted mb-4">Engagement shape across the 4 FDE domains (1–25)</p>

            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="domain"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'system-ui' }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 25]}
                  tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
                  tickCount={4}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 4 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-panel)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--text)',
                  }}
                  formatter={(value: unknown) => [`${value}/25`, 'Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Domain score cards */}
          <div className="grid grid-cols-2 gap-3">
            {scorecardDomains.map((domain, i) => {
              const score = scorecardScores[domain.id] || 0
              const tier = getTier(score)
              return (
                <div key={domain.id} className="theme-panel border theme-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold" style={{ color: DOMAIN_COLORS[i] }}>{domain.id}</span>
                    <span className="font-mono font-bold text-xl theme-text">{score || '—'}</span>
                  </div>
                  <div className="text-xs theme-muted mb-2 leading-snug">{domain.shortLabel}</div>
                  <div className="h-1.5 theme-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: score ? `${(score / 25) * 100}%` : '0%', backgroundColor: tier.color }}
                    />
                  </div>
                  <div className="text-xs mt-1.5 font-mono" style={{ color: tier.color }}>{tier.label}</div>
                </div>
              )
            })}
          </div>

          {/* Gate thresholds reference */}
          <div className="theme-panel border theme-border rounded-xl p-4">
            <h4 className="text-xs font-semibold theme-muted uppercase tracking-wider mb-3">Milestone Gate Requirements</h4>
            <div className="space-y-2">
              {[
                { milestone: 'Architecture Review', req: 'Product Sense ≥ Baseline (8+)', domainId: 'D1', minScore: 8 },
                { milestone: 'Build Begins', req: 'Agentic Architecture ≥ Baseline (8+)', domainId: 'D2', minScore: 8 },
                { milestone: 'Go Live', req: 'Production Systems ≥ Baseline (8+)', domainId: 'D3', minScore: 8 },
              ].map(gate => {
                const score = scorecardScores[gate.domainId] || 0
                const met = score >= gate.minScore
                return (
                  <div key={gate.milestone} className={`flex items-center justify-between p-2 rounded-lg border ${met ? 'border-go/30 bg-go/5' : 'border-border bg-surface/50'}`}>
                    <div>
                      <div className={`text-xs font-semibold ${met ? 'text-go' : 'theme-text'}`}>{gate.milestone}</div>
                      <div className="text-xs theme-muted">{gate.req}</div>
                    </div>
                    <div className={`text-xs font-mono font-bold ${met ? 'text-go' : 'text-stop'}`}>
                      {met ? '✓ MET' : `${score}/25`}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
