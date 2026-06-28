import { useState } from 'react'
import { Sparkles, Download, Copy, Check, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { generateVerdict } from '../../lib/aiVerdict'
import type { VerdictResult } from '../../lib/aiVerdict'
import { generateMarkdown, downloadMarkdown } from '../../lib/exportMarkdown'
import { GateBadge } from '../ui/GateBadge'
import { LLMSettings } from '../ui/LLMSettings'
import type { LLMConfig } from '../../lib/llmClient'

interface Props {
  meta: { customerName: string; useCaseName: string; date: string; fde: string; useCaseSummary: string }
  answers: Record<string, string>
  triggeredFlags: string[]
  rubricScores: Record<string, number>
  scorecardScores: Record<string, number>
  scorecardNotes: Record<string, string>
  llmConfig: LLMConfig
  setLLMConfig: (c: LLMConfig) => void
  verdict: VerdictResult | null
  setVerdict: (v: VerdictResult | null) => void
}

export function VerdictTab({
  meta, answers, triggeredFlags, rubricScores, scorecardScores, scorecardNotes,
  llmConfig, setLLMConfig, verdict, setVerdict,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showRaw, setShowRaw] = useState(false)

  const isConfigured = llmConfig.provider === 'anthropic'
    ? !!llmConfig.anthropicKey
    : !!llmConfig.localBaseUrl && !!llmConfig.localModel

  const runVerdict = async () => {
    if (!isConfigured) { setError('Configure your LLM provider first.'); return }
    setLoading(true)
    setError('')
    try {
      const result = await generateVerdict({
        llmConfig, meta, answers, triggeredFlags, rubricScores, scorecardScores, scorecardNotes,
      })
      setVerdict(result)
    } catch (e: any) {
      setError(e.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const md = generateMarkdown({
      meta, answers, triggeredFlags, rubricScores, scorecardScores, scorecardNotes,
      verdict: verdict?.gate || '',
      verdictRaw: verdict
        ? `**Gate Decision:** ${verdict.gate} (${verdict.confidence}% confidence)\n\n${verdict.summary}\n\n**Top Blockers:**\n${verdict.blockers.map(b => `- **${b.title}:** ${b.detail}`).join('\n')}\n\n**Positive Signals:**\n${verdict.signals.map(s => `- **${s.title}:** ${s.detail}`).join('\n')}\n\n**Recommended Next Steps:**\n${verdict.nextSteps.map(s => `- ${s}`).join('\n')}`
        : '',
    })
    const slug = [meta.customerName, meta.useCaseName].filter(Boolean).map(s => s.replace(/\s+/g, '-')).join('-') || 'discovery'
    downloadMarkdown(md, `FDE-${slug}-${meta.date || 'undated'}.md`)
  }

  const handleCopy = async () => {
    const md = generateMarkdown({
      meta, answers, triggeredFlags, rubricScores, scorecardScores, scorecardNotes,
      verdict: verdict?.gate || '',
      verdictRaw: verdict?.raw || '',
    })
    await navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const gateDescriptions: Record<string, string> = {
    'PUSH TO PROD': 'Strong signal. All critical gates passed. Begin architecture sprint.',
    'CONDITIONAL': 'Viable path exists. Resolve the listed gaps within 2 weeks before build begins.',
    'PAUSE': 'Significant structural gaps. Revisit in 4–6 weeks when blockers are resolved.',
    'NO-GO': 'Fundamental disqualifiers present. Economics, liability, or business case does not hold.',
  }

  return (
    <div className="space-y-6">
      {/* LLM Settings */}
      <LLMSettings config={llmConfig} onChange={setLLMConfig} />

      {/* Run verdict */}
      <div className="flex gap-3">
        <button
          onClick={runVerdict}
          disabled={loading || !isConfigured}
          className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? 'Generating AI Verdict...' : 'Generate AI Verdict'}
        </button>
        <button onClick={handleExport} className="flex items-center gap-2 theme-panel border theme-border hover:border-slate-500 theme-dim font-semibold py-3 px-5 rounded-xl transition-colors">
          <Download size={16} />
          Export .md
        </button>
        <button onClick={handleCopy} className="flex items-center gap-2 theme-panel border theme-border hover:border-slate-500 theme-dim font-semibold py-3 px-5 rounded-xl transition-colors">
          {copied ? <Check size={16} className="text-go" /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy MD'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-stop/10 border border-stop/30 rounded-xl text-stop text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {verdict && (
        <div className="space-y-4">
          <div className="theme-panel border theme-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs theme-muted uppercase tracking-wider mb-2">Gate Decision</div>
                <GateBadge gate={verdict.gate} />
                <p className="text-sm theme-muted mt-2">{gateDescriptions[verdict.gate]}</p>
              </div>
              <div className="text-right">
                <div className="text-xs theme-muted uppercase tracking-wider mb-1">AI Confidence</div>
                <div className="font-mono font-bold text-4xl theme-text">{verdict.confidence}<span className="text-muted text-xl">%</span></div>
              </div>
            </div>
            <div className="p-4 theme-surface border theme-border rounded-xl">
              <p className="text-sm theme-dim leading-relaxed">{verdict.summary}</p>
            </div>
          </div>

          {verdict.blockers.length > 0 && (
            <div className="theme-panel border border-stop/30 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-stop uppercase tracking-wider mb-3">Top Blockers</h3>
              <div className="space-y-3">
                {verdict.blockers.map((b, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="font-mono text-stop text-sm shrink-0">{i + 1}.</span>
                    <div>
                      <div className="text-sm font-semibold theme-text">{b.title}</div>
                      <div className="text-sm theme-muted mt-0.5">{b.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {verdict.signals.length > 0 && (
            <div className="theme-panel border border-go/30 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-go uppercase tracking-wider mb-3">Positive Signals</h3>
              <div className="space-y-3">
                {verdict.signals.map((s, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="font-mono text-go text-sm shrink-0">{i + 1}.</span>
                    <div>
                      <div className="text-sm font-semibold theme-text">{s.title}</div>
                      <div className="text-sm theme-muted mt-0.5">{s.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {verdict.nextSteps.length > 0 && (
            <div className="theme-panel border border-accent/30 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Recommended Next Steps</h3>
              <div className="space-y-2">
                {verdict.nextSteps.map((step, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="font-mono text-accent shrink-0">{i + 1}.</span>
                    <span className="theme-dim">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setShowRaw(v => !v)} className="flex items-center gap-2 text-xs theme-muted hover:theme-dim transition-colors">
            {showRaw ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showRaw ? 'Hide' : 'Show'} raw AI response
          </button>
          {showRaw && (
            <pre className="theme-surface border theme-border rounded-xl p-4 text-xs text-muted overflow-x-auto whitespace-pre-wrap">
              {verdict.raw}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
