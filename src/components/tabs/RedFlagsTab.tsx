import { useState, useCallback } from 'react'
import { AlertTriangle, ShieldAlert, AlertCircle, Flag, Sparkles } from 'lucide-react'
import { redFlags } from '../../data/redFlags'
import { autoDetectFlags } from '../../lib/autoDetectFlags'
import { AutoDetectBanner } from '../ui/AutoDetectBanner'

interface Props {
  triggeredFlags: string[]
  setTriggeredFlags: (flags: string[]) => void
  answers: Record<string, string>
  apiKey: string
}

const severityConfig = {
  critical: { label: 'CRITICAL', icon: ShieldAlert, color: 'text-stop', bg: 'bg-stop/5', border: 'border-stop/30', badgeColor: 'bg-stop/20 text-stop border border-stop/40' },
  high: { label: 'HIGH', icon: AlertTriangle, color: 'text-caution', bg: 'bg-caution/5', border: 'border-caution/30', badgeColor: 'bg-caution/20 text-caution border border-caution/40' },
  medium: { label: 'MEDIUM', icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-400/5', border: 'border-orange-400/30', badgeColor: 'bg-orange-400/20 text-orange-400 border border-orange-400/40' },
}

export function RedFlagsTab({ triggeredFlags, setTriggeredFlags, answers, apiKey }: Props) {
  const [detectStatus, setDetectStatus] = useState<'idle' | 'scanning' | 'ready' | 'error'>('idle')
  const [suggested, setSuggested] = useState<string[]>([])
  const [reasoning, setReasoning] = useState('')

  const toggle = (id: string) => {
    if (triggeredFlags.includes(id)) {
      setTriggeredFlags(triggeredFlags.filter(f => f !== id))
    } else {
      setTriggeredFlags([...triggeredFlags, id])
    }
  }

  const runDetection = useCallback(async () => {
    if (!apiKey) return
    setDetectStatus('scanning')
    try {
      const result = await autoDetectFlags({ apiKey, answers, currentlyTriggered: triggeredFlags })
      setSuggested(result.suggested)
      setReasoning(result.reasoning)
      setDetectStatus('ready')
    } catch {
      setDetectStatus('error')
    }
  }, [apiKey, answers, triggeredFlags])

  const acceptAll = () => {
    const newFlags = [...new Set([...triggeredFlags, ...suggested])]
    setTriggeredFlags(newFlags)
    setDetectStatus('idle')
  }

  const acceptOne = (id: string) => {
    if (!triggeredFlags.includes(id)) setTriggeredFlags([...triggeredFlags, id])
    const remaining = suggested.filter(s => s !== id && !triggeredFlags.includes(s))
    if (remaining.length === 0) setDetectStatus('idle')
    else setSuggested(prev => prev.filter(s => s !== id))
  }

  const critical = triggeredFlags.filter(id => redFlags.find(f => f.id === id)?.severity === 'critical').length
  const high = triggeredFlags.filter(id => redFlags.find(f => f.id === id)?.severity === 'high').length
  const total = triggeredFlags.length

  const statusColor = total >= 5 || critical >= 2 ? 'text-stop' : total >= 3 ? 'text-caution' : 'text-go'
  const statusBg = total >= 5 || critical >= 2 ? 'bg-stop/10 border-stop/30' : total >= 3 ? 'bg-caution/10 border-caution/30' : 'bg-go/10 border-go/30'
  const statusLabel = total >= 5 || critical >= 2 ? 'STOP — Rescope before committing' : total >= 3 ? 'CAUTION — Address before build begins' : total > 0 ? 'WATCH — Monitor these areas' : 'CLEAR'

  return (
    <div>
      {/* Summary bar */}
      <div className={`flex items-center justify-between p-4 rounded-xl border mb-4 ${statusBg}`}>
        <div className="flex items-center gap-3">
          <Flag className={statusColor} size={20} />
          <div>
            <div className={`font-mono font-bold text-lg ${statusColor}`}>{statusLabel}</div>
            <div className="text-xs text-muted">Toggle any flags you heard during the call</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4 text-right">
            <div>
              <div className="font-mono font-bold text-2xl theme-text">{total}</div>
              <div className="text-xs text-muted">triggered</div>
            </div>
            <div>
              <div className="font-mono font-bold text-2xl text-stop">{critical}</div>
              <div className="text-xs text-muted">critical</div>
            </div>
            <div>
              <div className="font-mono font-bold text-2xl text-caution">{high}</div>
              <div className="text-xs text-muted">high</div>
            </div>
          </div>

          {/* AI detect button */}
          {apiKey && (
            <button
              onClick={runDetection}
              disabled={detectStatus === 'scanning'}
              className="flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 shrink-0"
              title="Scan your notes with AI to detect red flags"
            >
              <Sparkles size={13} />
              AI Scan Notes
            </button>
          )}
        </div>
      </div>

      {/* Auto-detect banner */}
      {detectStatus !== 'idle' && (
        <div className="mb-4">
          <AutoDetectBanner
            status={detectStatus}
            suggested={suggested}
            reasoning={reasoning}
            currentlyTriggered={triggeredFlags}
            onAcceptAll={acceptAll}
            onAcceptOne={acceptOne}
            onDismiss={() => setDetectStatus('idle')}
          />
        </div>
      )}

      {!apiKey && (
        <div className="mb-4 px-4 py-3 bg-caution/5 border border-caution/20 rounded-xl text-xs text-caution">
          Add your Anthropic API key in the AI Verdict tab to enable automatic red flag detection from your notes.
        </div>
      )}

      <div className="space-y-2">
        {redFlags.map(flag => {
          const config = severityConfig[flag.severity]
          const Icon = config.icon
          const active = triggeredFlags.includes(flag.id)
          const aiSuggested = suggested.includes(flag.id) && !triggeredFlags.includes(flag.id)

          return (
            <button
              key={flag.id}
              onClick={() => toggle(flag.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                active
                  ? `${config.bg} ${config.border}`
                  : aiSuggested
                  ? 'bg-accent/5 border-accent/30 hover:border-accent/50'
                  : 'theme-panel border-border theme-tab-hover'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 p-1 rounded ${active ? config.bg : 'bg-border/20'}`}>
                  <Icon size={14} className={active ? config.color : 'text-muted'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${config.badgeColor}`}>
                      {config.label}
                    </span>
                    {aiSuggested && (
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/30">
                        AI DETECTED
                      </span>
                    )}
                    <span className={`text-sm font-medium ${active ? 'theme-text' : 'theme-dim'}`}>
                      {flag.flag}
                    </span>
                  </div>
                  {active && (
                    <p className={`mt-1.5 text-xs ${config.color} leading-relaxed`}>
                      → {flag.translation}
                    </p>
                  )}
                </div>
                <div className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  active ? 'border-stop bg-stop' : aiSuggested ? 'border-accent' : 'border-border'
                }`}>
                  {active && <span className="text-white text-xs font-bold">✓</span>}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
