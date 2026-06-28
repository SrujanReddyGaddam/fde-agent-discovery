import { useState } from 'react'
import { Key, Server, ChevronDown, ChevronUp, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type { LLMConfig } from '../../lib/llmClient'

interface Props {
  config: LLMConfig
  onChange: (config: LLMConfig) => void
}

const SUGGESTED_MODELS = [
  { id: 'llama-3.2-11b-instruct', label: 'Llama 3.2 11B (recommended)' },
  { id: 'qwen2.5-14b-instruct', label: 'Qwen 2.5 14B' },
  { id: 'phi-4', label: 'Phi-4 14B' },
  { id: 'mistral-small-3.1-22b-instruct', label: 'Mistral Small 3.1 22B' },
  { id: 'gemma-3-12b-it', label: 'Gemma 3 12B' },
  { id: 'google/gemma-4-e4b', label: 'Gemma 4 E4B (current)' },
]

export function LLMSettings({ config, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle')
  const [testError, setTestError] = useState('')
  const [keyVisible, setKeyVisible] = useState(false)

  const testConnection = async () => {
    setTestStatus('testing')
    setTestError('')
    try {
      if (config.provider === 'anthropic') {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        const client = new Anthropic({ apiKey: config.anthropicKey, dangerouslyAllowBrowser: true })
        await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        })
      } else {
        const url = `${config.localBaseUrl.replace(/\/$/, '')}/chat/completions`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.localModel,
            messages: [{ role: 'user', content: 'Say OK' }],
            max_tokens: 5,
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      }
      setTestStatus('ok')
    } catch (e: any) {
      setTestError(e.message || 'Connection failed')
      setTestStatus('fail')
    }
  }

  return (
    <div className="theme-panel border theme-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:theme-surface transition-colors"
      >
        <div className="flex items-center gap-3">
          {config.provider === 'anthropic'
            ? <Key size={16} className="text-accent" />
            : <Server size={16} className="text-go" />
          }
          <div className="text-left">
            <div className="text-sm font-semibold theme-text">
              {config.provider === 'anthropic' ? 'Anthropic API' : 'Local LLM (LM Studio)'}
            </div>
            <div className="text-xs theme-muted">
              {config.provider === 'anthropic'
                ? config.anthropicKey ? 'Key configured' : 'No key set'
                : `${config.localBaseUrl} · ${config.localModel || 'no model set'}`
              }
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {testStatus === 'ok' && <CheckCircle2 size={14} className="text-go" />}
          {testStatus === 'fail' && <XCircle size={14} className="text-stop" />}
          {open ? <ChevronUp size={14} className="theme-muted" /> : <ChevronDown size={14} className="theme-muted" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t theme-border space-y-4 pt-4">
          {/* Provider toggle */}
          <div>
            <label className="text-xs font-semibold theme-muted uppercase tracking-wider block mb-2">Provider</label>
            <div className="flex gap-2">
              <button
                onClick={() => onChange({ ...config, provider: 'anthropic' })}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all ${
                  config.provider === 'anthropic'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border theme-muted hover:border-slate-400'
                }`}
              >
                <Key size={13} />
                Anthropic API
              </button>
              <button
                onClick={() => onChange({ ...config, provider: 'local' })}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all ${
                  config.provider === 'local'
                    ? 'border-go bg-go/10 text-go'
                    : 'border-border theme-muted hover:border-slate-400'
                }`}
              >
                <Server size={13} />
                Local LLM
              </button>
            </div>
          </div>

          {/* Anthropic settings */}
          {config.provider === 'anthropic' && (
            <div>
              <label className="text-xs font-semibold theme-muted uppercase tracking-wider block mb-1.5">
                API Key
              </label>
              <div className="flex gap-2">
                <input
                  type={keyVisible ? 'text' : 'password'}
                  placeholder="sk-ant-..."
                  value={config.anthropicKey}
                  onChange={e => onChange({ ...config, anthropicKey: e.target.value })}
                  className="flex-1 theme-input theme-text border theme-border rounded-lg px-3 py-2 text-sm font-mono placeholder:text-slate-500 focus:border-accent/60 outline-none transition-colors"
                />
                <button
                  onClick={() => setKeyVisible(v => !v)}
                  className="px-3 py-2 border theme-border rounded-lg text-xs theme-muted hover:theme-text transition-colors"
                >
                  {keyVisible ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs theme-muted mt-1.5">Stored in localStorage — never leaves your browser</p>
            </div>
          )}

          {/* Local LLM settings */}
          {config.provider === 'local' && (
            <>
              <div>
                <label className="text-xs font-semibold theme-muted uppercase tracking-wider block mb-1.5">
                  LM Studio Base URL
                </label>
                <input
                  type="text"
                  placeholder="http://localhost:1234/v1"
                  value={config.localBaseUrl}
                  onChange={e => onChange({ ...config, localBaseUrl: e.target.value })}
                  className="w-full theme-input theme-text border theme-border rounded-lg px-3 py-2 text-sm font-mono placeholder:text-slate-500 focus:border-accent/60 outline-none transition-colors"
                />
                <p className="text-xs theme-muted mt-1">Default LM Studio port. Works on Vercel too — browser calls your local machine directly.</p>
              </div>

              <div>
                <label className="text-xs font-semibold theme-muted uppercase tracking-wider block mb-1.5">
                  Model
                </label>
                <input
                  type="text"
                  placeholder="llama-3.2-11b-instruct"
                  value={config.localModel}
                  onChange={e => onChange({ ...config, localModel: e.target.value })}
                  className="w-full theme-input theme-text border theme-border rounded-lg px-3 py-2 text-sm font-mono placeholder:text-slate-500 focus:border-accent/60 outline-none transition-colors mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_MODELS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => onChange({ ...config, localModel: m.id })}
                      className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                        config.localModel === m.id
                          ? 'border-go bg-go/10 text-go'
                          : 'border-border theme-muted hover:border-slate-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs theme-muted mt-2">
                  Must match exactly what LM Studio shows as the loaded model name.
                  Gemma 4 E4B will work for simple tasks but may struggle with long JSON prompts.
                </p>
              </div>
            </>
          )}

          {/* Test connection */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={testConnection}
              disabled={testStatus === 'testing'}
              className="flex items-center gap-2 px-4 py-2 border theme-border rounded-lg text-sm theme-muted hover:text-accent hover:border-accent/50 transition-colors disabled:opacity-50"
            >
              {testStatus === 'testing' ? <Loader2 size={13} className="animate-spin" /> : null}
              Test Connection
            </button>
            {testStatus === 'ok' && <span className="text-sm text-go">Connected ✓</span>}
            {testStatus === 'fail' && <span className="text-sm text-stop">{testError}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
