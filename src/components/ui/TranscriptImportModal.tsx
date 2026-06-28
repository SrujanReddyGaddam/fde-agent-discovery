import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, X, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { importTranscript, type ImportResult, type ImportProgress } from '../../lib/transcriptImport'
import type { LLMConfig } from '../../lib/llmClient'

interface Props {
  llmConfig: LLMConfig
  existingAnswers: Record<string, string>
  onImport: (answers: Record<string, string>, confidence: Record<string, 'high' | 'medium' | 'low' | 'none'>) => void
  onClose: () => void
}

type Step = 'upload' | 'processing' | 'review' | 'error'

const confidenceConfig = {
  high:   { label: 'High confidence', color: 'text-go',     bg: 'bg-go/10 border-go/30' },
  medium: { label: 'Medium confidence', color: 'text-caution', bg: 'bg-caution/10 border-caution/30' },
  low:    { label: 'Low confidence',  color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30' },
  none:   { label: 'Not found',       color: 'text-muted',   bg: 'bg-border/20 border-border' },
}

export function TranscriptImportModal({ llmConfig, existingAnswers, onImport, onClose }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [transcript, setTranscript] = useState('')
  const [fileName, setFileName] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [mergeMode, setMergeMode] = useState<'overwrite' | 'append' | 'skip'>('skip')
  const [showRaw, setShowRaw] = useState(false)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => setTranscript(e.target?.result as string || '')
    reader.readAsText(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  const runImport = async () => {
    if (!transcript.trim()) return
    setStep('processing')
    setError('')
    setProgress(null)
    try {
      const res = await importTranscript(llmConfig, transcript, (p) => setProgress(p))
      setResult(res)
      setStep('review')
    } catch (e: any) {
      setError(e.message || 'Import failed')
      setStep('error')
    }
  }

  const handleAccept = () => {
    if (!result) return
    const merged: Record<string, string> = { ...existingAnswers }

    Object.entries(result.answers).forEach(([id, value]) => {
      if (!value) return
      const existing = existingAnswers[id]?.trim()
      if (!existing) {
        merged[id] = value
      } else if (mergeMode === 'overwrite') {
        merged[id] = value
      } else if (mergeMode === 'append') {
        merged[id] = `${existing}\n\n---\n*From transcript:* ${value}`
      }
      // 'skip' = keep existing, don't touch
    })

    onImport(merged, result.confidence)
    onClose()
  }

  const hasConflicts = result
    ? Object.keys(result.answers).some(id => existingAnswers[id]?.trim())
    : false

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="theme-panel border theme-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b theme-border shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            <h2 className="font-semibold theme-text">Import Transcript</h2>
          </div>
          <button onClick={onClose} className="theme-muted hover:text-stop transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Step: upload */}
          {(step === 'upload' || step === 'error') && (
            <>
              <p className="text-sm theme-muted">
                Drop your meeting transcript, Otter/Fireflies export, or any notes file. Claude will read it and populate the discovery questionnaire — only fields with actual evidence get filled.
              </p>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragging ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50 hover:bg-accent/3'
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".md,.txt,.text"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <Upload size={28} className="mx-auto mb-3 theme-muted" />
                {fileName ? (
                  <div>
                    <div className="flex items-center justify-center gap-2 text-sm text-accent font-medium">
                      <FileText size={14} />
                      {fileName}
                    </div>
                    <p className="text-xs theme-muted mt-1">{transcript.length.toLocaleString()} characters loaded</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm theme-text font-medium">Drop .md or .txt file here</p>
                    <p className="text-xs theme-muted mt-1">or click to browse</p>
                  </>
                )}
              </div>

              {/* Paste option */}
              <div>
                <label className="text-xs font-semibold theme-muted uppercase tracking-wider block mb-2">
                  Or paste transcript directly
                </label>
                <textarea
                  rows={6}
                  placeholder="Paste meeting notes, transcript, or any text here..."
                  value={transcript}
                  onChange={e => { setTranscript(e.target.value); setFileName('') }}
                  className="w-full theme-input theme-text border theme-border rounded-xl px-4 py-3 text-sm placeholder:text-slate-500 resize-none focus:border-accent/60 outline-none transition-colors font-mono"
                />
              </div>

              {step === 'error' && (
                <div className="flex items-center gap-2 p-3 bg-stop/10 border border-stop/30 rounded-xl text-sm text-stop">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              {llmConfig.provider === 'anthropic' && !llmConfig.anthropicKey && (
                <div className="p-3 bg-caution/10 border border-caution/30 rounded-xl text-sm text-caution">
                  Configure your LLM provider in the AI Verdict tab first.
                </div>
              )}
            </>
          )}

          {/* Step: processing */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-5">
              <Loader2 size={36} className="text-accent animate-spin" />
              <div className="text-center w-full max-w-sm">
                <p className="font-semibold theme-text">Analysing transcript...</p>
                <p className="text-sm theme-muted mt-1 mb-4">
                  Processing in batches — smaller prompts work better with local models
                </p>
                {progress && (
                  <>
                    <div className="h-2 theme-surface rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-accent font-mono">
                      {progress.current}/{progress.total} — {progress.label}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step: review */}
          {step === 'review' && result && (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="theme-surface border theme-border rounded-xl p-4 text-center">
                  <div className="font-mono font-bold text-2xl text-accent">{result.coverage}%</div>
                  <div className="text-xs theme-muted mt-1">questions covered</div>
                </div>
                <div className="theme-surface border theme-border rounded-xl p-4 text-center">
                  <div className="font-mono font-bold text-2xl text-go">
                    {Object.values(result.confidence).filter(c => c === 'high').length}
                  </div>
                  <div className="text-xs theme-muted mt-1">high confidence</div>
                </div>
                <div className="theme-surface border theme-border rounded-xl p-4 text-center">
                  <div className="font-mono font-bold text-2xl theme-text">
                    {Object.keys(result.answers).length}
                  </div>
                  <div className="text-xs theme-muted mt-1">fields populated</div>
                </div>
              </div>

              {/* Merge mode — only show if conflicts exist */}
              {hasConflicts && (
                <div className="p-4 bg-caution/5 border border-caution/30 rounded-xl">
                  <p className="text-sm font-semibold text-caution mb-2">
                    Some fields already have notes. How should we handle conflicts?
                  </p>
                  <div className="flex gap-2">
                    {(['skip', 'append', 'overwrite'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setMergeMode(mode)}
                        className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                          mergeMode === mode
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border theme-muted hover:border-slate-400'
                        }`}
                      >
                        {mode === 'skip' && 'Keep existing'}
                        {mode === 'append' && 'Append below'}
                        {mode === 'overwrite' && 'Overwrite'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Flagged topics */}
              {result.flaggedTopics.length > 0 && (
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
                  <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">Topics mentioned but not mapped to a question</p>
                  <div className="flex flex-wrap gap-2">
                    {result.flaggedTopics.map((t, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-accent/10 text-accent border border-accent/20 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Answer preview */}
              <div>
                <p className="text-xs font-semibold theme-muted uppercase tracking-wider mb-3">Extracted Answers Preview</p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {Object.entries(result.answers).map(([id, answer]) => {
                    const conf = result.confidence[id] || 'none'
                    const cfg = confidenceConfig[conf]
                    const hasConflict = !!existingAnswers[id]?.trim()
                    return (
                      <div key={id} className={`p-3 rounded-xl border ${cfg.bg}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs font-bold text-accent">{id}</span>
                          <div className="flex items-center gap-2">
                            {hasConflict && (
                              <span className="text-xs text-caution border border-caution/40 bg-caution/10 px-1.5 py-0.5 rounded">conflict</span>
                            )}
                            <span className={`text-xs font-mono ${cfg.color}`}>{cfg.label}</span>
                          </div>
                        </div>
                        <p className="text-xs theme-dim leading-relaxed">{answer}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Raw toggle */}
              <button
                onClick={() => setShowRaw(v => !v)}
                className="flex items-center gap-1.5 text-xs theme-muted hover:theme-dim transition-colors"
              >
                {showRaw ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showRaw ? 'Hide' : 'Show'} raw AI response
              </button>
              {showRaw && (
                <pre className="theme-surface border theme-border rounded-xl p-4 text-xs theme-muted overflow-x-auto whitespace-pre-wrap">
                  {result.raw}
                </pre>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t theme-border shrink-0 flex gap-3">
          {step === 'upload' || step === 'error' ? (
            <>
              <button
                onClick={runImport}
                disabled={!transcript.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                <Sparkles size={15} />
                Analyse & Import
              </button>
              <button onClick={onClose} className="px-5 py-2.5 border theme-border theme-muted hover:theme-text rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </>
          ) : step === 'review' ? (
            <>
              <button
                onClick={handleAccept}
                className="flex-1 flex items-center justify-center gap-2 bg-go hover:bg-green-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                <CheckCircle2 size={15} />
                Apply to Discovery — {Object.keys(result?.answers || {}).length} fields
              </button>
              <button
                onClick={() => setStep('upload')}
                className="px-5 py-2.5 border theme-border theme-muted hover:theme-text rounded-xl text-sm transition-colors"
              >
                Try Again
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
