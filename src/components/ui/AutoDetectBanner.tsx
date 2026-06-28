import { Sparkles, Check, X, Loader2 } from 'lucide-react'
import { redFlags } from '../../data/redFlags'

interface Props {
  status: 'idle' | 'scanning' | 'ready' | 'error'
  suggested: string[]
  reasoning: string
  currentlyTriggered: string[]
  onAcceptAll: () => void
  onAcceptOne: (id: string) => void
  onDismiss: () => void
}

export function AutoDetectBanner({ status, suggested, reasoning, currentlyTriggered, onAcceptAll, onAcceptOne, onDismiss }: Props) {
  const newSuggestions = suggested.filter(id => !currentlyTriggered.includes(id))

  if (status === 'idle') return null

  if (status === 'scanning') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-accent/5 border border-accent/20 rounded-xl text-sm theme-muted">
        <Loader2 size={14} className="text-accent animate-spin shrink-0" />
        Scanning notes for red flags…
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-stop/5 border border-stop/20 rounded-xl">
        <span className="text-sm text-stop">Auto-detect failed — check your API key.</span>
        <button onClick={onDismiss} className="text-muted hover:text-stop"><X size={14} /></button>
      </div>
    )
  }

  if (status === 'ready' && newSuggestions.length === 0) {
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-go/5 border border-go/20 rounded-xl">
        <div className="flex items-center gap-2 text-sm text-go">
          <Sparkles size={14} />
          {suggested.length === 0
            ? 'No additional red flags detected in your notes.'
            : 'All detected flags are already marked.'}
          {reasoning && <span className="text-xs theme-muted ml-1">— {reasoning}</span>}
        </div>
        <button onClick={onDismiss} className="theme-muted hover:theme-text ml-3 shrink-0"><X size={14} /></button>
      </div>
    )
  }

  return (
    <div className="bg-accent/5 border border-accent/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-accent/20">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-accent" />
          <span className="text-sm font-semibold text-accent">
            AI detected {newSuggestions.length} new flag{newSuggestions.length !== 1 ? 's' : ''} in your notes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAcceptAll}
            className="text-xs font-semibold text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 px-2.5 py-1 rounded-lg transition-colors"
          >
            Accept All
          </button>
          <button onClick={onDismiss} className="theme-muted hover:theme-text"><X size={14} /></button>
        </div>
      </div>

      {reasoning && (
        <div className="px-4 py-2 text-xs theme-muted italic border-b border-accent/10">{reasoning}</div>
      )}

      {/* Individual flags */}
      <div className="divide-y divide-accent/10">
        {newSuggestions.map(id => {
          const flag = redFlags.find(f => f.id === id)
          if (!flag) return null
          const severityColor = flag.severity === 'critical' ? 'text-stop' : flag.severity === 'high' ? 'text-caution' : 'text-orange-400'
          return (
            <div key={id} className="flex items-start justify-between gap-3 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-mono font-bold ${severityColor} mr-2`}>[{flag.severity.toUpperCase()}]</span>
                <span className="text-sm theme-dim">{flag.flag}</span>
              </div>
              <button
                onClick={() => onAcceptOne(id)}
                className="flex items-center gap-1 text-xs text-go bg-go/10 hover:bg-go/20 border border-go/30 px-2 py-1 rounded-lg transition-colors shrink-0"
              >
                <Check size={11} />
                Flag it
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
