import { AlertTriangle, ShieldAlert, AlertCircle, Flag } from 'lucide-react'
import { redFlags } from '../../data/redFlags'

interface Props {
  triggeredFlags: string[]
  setTriggeredFlags: (flags: string[]) => void
}

const severityConfig = {
  critical: { label: 'CRITICAL', icon: ShieldAlert, color: 'text-stop', bg: 'bg-stop/5', border: 'border-stop/30', badgeColor: 'bg-stop/20 text-stop border border-stop/40' },
  high: { label: 'HIGH', icon: AlertTriangle, color: 'text-caution', bg: 'bg-caution/5', border: 'border-caution/30', badgeColor: 'bg-caution/20 text-caution border border-caution/40' },
  medium: { label: 'MEDIUM', icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-400/5', border: 'border-orange-400/30', badgeColor: 'bg-orange-400/20 text-orange-400 border border-orange-400/40' },
}

export function RedFlagsTab({ triggeredFlags, setTriggeredFlags }: Props) {
  const toggle = (id: string) => {
    if (triggeredFlags.includes(id)) {
      setTriggeredFlags(triggeredFlags.filter(f => f !== id))
    } else {
      setTriggeredFlags([...triggeredFlags, id])
    }
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
      <div className={`flex items-center justify-between p-4 rounded-xl border mb-6 ${statusBg}`}>
        <div className="flex items-center gap-3">
          <Flag className={statusColor} size={20} />
          <div>
            <div className={`font-mono font-bold text-lg ${statusColor}`}>{statusLabel}</div>
            <div className="text-xs text-muted">Toggle any flags you heard during the call</div>
          </div>
        </div>
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
      </div>

      <div className="space-y-2">
        {redFlags.map(flag => {
          const config = severityConfig[flag.severity]
          const Icon = config.icon
          const active = triggeredFlags.includes(flag.id)

          return (
            <button
              key={flag.id}
              onClick={() => toggle(flag.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                active
                  ? `${config.bg} ${config.border}`
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
                    <span className={`text-sm font-medium ${active ? 'theme-text font-semibold' : 'theme-dim'}`}>
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
                  active ? 'border-stop bg-stop' : 'border-border'
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
