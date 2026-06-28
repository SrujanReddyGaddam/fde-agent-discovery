import { useState } from 'react'
import { LayoutDashboard, ClipboardList, Flag, BarChart3, Activity, Sparkles, User, Building2, Calendar, FileText, Sun, Moon } from 'lucide-react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useTheme } from './context/ThemeContext'
import { MissionControlTab } from './components/tabs/MissionControlTab'
import { QualificationTab } from './components/tabs/QualificationTab'
import { RedFlagsTab } from './components/tabs/RedFlagsTab'
import { RubricTab } from './components/tabs/RubricTab'
import { ScorecardTab } from './components/tabs/ScorecardTab'
import { VerdictTab } from './components/tabs/VerdictTab'
import { redFlags } from './data/redFlags'
import { rubricDimensions, MAX_RUBRIC_SCORE } from './data/rubric'
import { scorecardDomains } from './data/scorecard'
import type { VerdictResult } from './lib/aiVerdict'

type Tab = 'mission' | 'qualification' | 'redflags' | 'rubric' | 'scorecard' | 'verdict'

const TABS: { id: Tab; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'mission', label: 'Mission Control', icon: LayoutDashboard },
  { id: 'qualification', label: 'Discovery', icon: ClipboardList },
  { id: 'redflags', label: 'Red Flags', icon: Flag },
  { id: 'rubric', label: 'Impact Rubric', icon: BarChart3 },
  { id: 'scorecard', label: 'Scorecard', icon: Activity },
  { id: 'verdict', label: 'AI Verdict', icon: Sparkles },
]

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<Tab>('mission')
  const [answers, setAnswers] = useLocalStorage<Record<string, string>>('fde-answers', {})
  const [triggeredFlags, setTriggeredFlags] = useLocalStorage<string[]>('fde-flags', [])
  const [rubricScores, setRubricScores] = useLocalStorage<Record<string, number>>('fde-rubric', {})
  const [scorecardScores, setScorecardScores] = useLocalStorage<Record<string, number>>('fde-scorecard', {})
  const [scorecardNotes, setScorecardNotes] = useLocalStorage<Record<string, string>>('fde-scorecard-notes', {})
  const [apiKey, setApiKey] = useLocalStorage<string>('fde-api-key', '')
  const [verdict, setVerdict] = useLocalStorage<VerdictResult | null>('fde-verdict', null)
  const [meta, setMeta] = useLocalStorage<{ customerName: string; date: string; fde: string; useCaseSummary: string }>(
    'fde-meta',
    { customerName: '', date: new Date().toISOString().split('T')[0], fde: '', useCaseSummary: '' }
  )

  const criticalFlags = triggeredFlags.filter(id => redFlags.find(f => f.id === id)?.severity === 'critical').length
  const rubricTotal = rubricDimensions.reduce((sum, d) => sum + (rubricScores[d.id] || 0) * d.weight, 0)
  const rubricPct = Math.round((rubricTotal / MAX_RUBRIC_SCORE) * 100)
  const avgScorecard = scorecardDomains.length > 0
    ? Math.round(scorecardDomains.reduce((sum, d) => sum + (scorecardScores[d.id] || 0), 0) / scorecardDomains.length)
    : 0

  const resetAll = () => {
    if (!confirm('Reset all discovery data? This cannot be undone.')) return
    setAnswers({})
    setTriggeredFlags([])
    setRubricScores({})
    setScorecardScores({})
    setScorecardNotes({})
    setVerdict(null)
    setMeta({ customerName: '', date: new Date().toISOString().split('T')[0], fde: '', useCaseSummary: '' })
  }

  return (
    <div className="min-h-screen theme-base theme-text">
      {/* Top header */}
      <header className="border-b theme-border theme-header backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
                <Sparkles size={16} className="text-accent" />
              </div>
              <div>
                <div className="font-semibold theme-text text-sm">FDE Agent Discovery</div>
                <div className="text-xs theme-muted">Agentic Push-to-Prod Evaluator</div>
              </div>
            </div>

            {/* Live stats */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <Flag size={12} className={criticalFlags >= 2 ? 'text-stop' : criticalFlags >= 1 ? 'text-caution' : 'text-muted'} />
                <span className="text-xs font-mono">
                  <span className={criticalFlags >= 2 ? 'text-stop font-bold' : 'theme-text'}>{triggeredFlags.length}</span>
                  <span className="theme-muted">/22 flags</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <BarChart3 size={12} className="theme-muted" />
                <span className="text-xs font-mono">
                  <span className="theme-text">{rubricPct}%</span>
                  <span className="theme-muted"> rubric</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity size={12} className="theme-muted" />
                <span className="text-xs font-mono">
                  <span className="theme-text">{avgScorecard || '—'}</span>
                  <span className="theme-muted">/25 scorecard</span>
                </span>
              </div>
              {verdict && (
                <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  verdict.gate === 'PUSH TO PROD' ? 'text-go border-go/40 bg-go/10' :
                  verdict.gate === 'CONDITIONAL' ? 'text-caution border-caution/40 bg-caution/10' :
                  verdict.gate === 'PAUSE' ? 'text-orange-400 border-orange-400/40 bg-orange-400/10' :
                  'text-stop border-stop/40 bg-stop/10'
                }`}>
                  {verdict.gate}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border theme-border theme-panel hover:border-accent/50 transition-colors text-xs theme-muted hover:text-accent"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
              <button
                onClick={resetAll}
                className="text-xs theme-muted hover:text-stop transition-colors"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Meta bar */}
      <div className="border-b theme-border theme-meta">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-muted shrink-0" />
              <input
                type="text"
                placeholder="Customer name"
                value={meta.customerName}
                onChange={e => setMeta({ ...meta, customerName: e.target.value })}
                className="flex-1 bg-transparent text-sm theme-text placeholder:text-slate-500 border-none outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <User size={14} className="text-muted shrink-0" />
              <input
                type="text"
                placeholder="Your name (FDE)"
                value={meta.fde}
                onChange={e => setMeta({ ...meta, fde: e.target.value })}
                className="flex-1 bg-transparent text-sm theme-text placeholder:text-slate-500 border-none outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-muted shrink-0" />
              <input
                type="date"
                value={meta.date}
                onChange={e => setMeta({ ...meta, date: e.target.value })}
                className="flex-1 bg-transparent text-sm theme-text border-none outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-muted shrink-0" />
              <input
                type="text"
                placeholder="Use case summary (one line)"
                value={meta.useCaseSummary}
                onChange={e => setMeta({ ...meta, useCaseSummary: e.target.value })}
                className="flex-1 bg-transparent text-sm theme-text placeholder:text-slate-500 border-none outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="border-b theme-border theme-surface">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                    active
                      ? 'border-accent text-accent font-semibold'
                      : 'border-transparent theme-muted hover:theme-text hover:border-border'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  {tab.id === 'redflags' && triggeredFlags.length > 0 && (
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded-full ${
                      criticalFlags >= 2 ? 'bg-stop/20 text-stop' : 'bg-caution/20 text-caution'
                    }`}>
                      {triggeredFlags.length}
                    </span>
                  )}
                  {tab.id === 'verdict' && verdict && (
                    <span className="w-1.5 h-1.5 rounded-full bg-go" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'mission' && (
          <MissionControlTab
            meta={meta}
            answers={answers}
            triggeredFlags={triggeredFlags}
            rubricScores={rubricScores}
            scorecardScores={scorecardScores}
            verdict={verdict}
          />
        )}
        {activeTab === 'qualification' && (
          <QualificationTab answers={answers} setAnswers={setAnswers} />
        )}
        {activeTab === 'redflags' && (
          <RedFlagsTab triggeredFlags={triggeredFlags} setTriggeredFlags={setTriggeredFlags} />
        )}
        {activeTab === 'rubric' && (
          <RubricTab scores={rubricScores} setScores={setRubricScores} />
        )}
        {activeTab === 'scorecard' && (
          <ScorecardTab
            scores={scorecardScores}
            setScores={setScorecardScores}
            notes={scorecardNotes}
            setNotes={setScorecardNotes}
          />
        )}
        {activeTab === 'verdict' && (
          <VerdictTab
            meta={meta}
            answers={answers}
            triggeredFlags={triggeredFlags}
            rubricScores={rubricScores}
            scorecardScores={scorecardScores}
            scorecardNotes={scorecardNotes}
            apiKey={apiKey}
            setApiKey={setApiKey}
            verdict={verdict}
            setVerdict={setVerdict}
          />
        )}
      </main>
    </div>
  )
}
