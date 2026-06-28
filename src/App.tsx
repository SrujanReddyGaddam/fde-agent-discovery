import { useState, useCallback, useEffect, useRef } from 'react'
import { LayoutDashboard, ClipboardList, Flag, BarChart3, Activity, Sparkles, User, Building2, Calendar, FileText, Layers, Sun, Moon } from 'lucide-react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useTheme } from './context/ThemeContext'
import { SessionManager } from './components/ui/SessionManager'
import { FolderStatus } from './components/ui/FolderStatus'
import { MissionControlTab } from './components/tabs/MissionControlTab'
import { QualificationTab } from './components/tabs/QualificationTab'
import { RedFlagsTab } from './components/tabs/RedFlagsTab'
import { RubricTab } from './components/tabs/RubricTab'
import type { LLMConfig } from './lib/llmClient'
import { ScorecardTab } from './components/tabs/ScorecardTab'
import { VerdictTab } from './components/tabs/VerdictTab'
import { redFlags } from './data/redFlags'
import { rubricDimensions, MAX_RUBRIC_SCORE } from './data/rubric'
import { scorecardDomains } from './data/scorecard'
import {
  loadSessions, saveSessions, getActiveId, setActiveId,
  createSession, duplicateSession,
  type Session,
} from './lib/sessionManager'
import {
  isSupported, pickFolder, getSavedHandle, clearSavedHandle,
  writeSession, deleteSessionFile, loadSessionsFromFolder, getFolderName,
} from './lib/fileStorage'

type Tab = 'mission' | 'qualification' | 'redflags' | 'rubric' | 'scorecard' | 'verdict'

const TABS: { id: Tab; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'mission', label: 'Mission Control', icon: LayoutDashboard },
  { id: 'qualification', label: 'Discovery', icon: ClipboardList },
  { id: 'redflags', label: 'Red Flags', icon: Flag },
  { id: 'rubric', label: 'Impact Rubric', icon: BarChart3 },
  { id: 'scorecard', label: 'Scorecard', icon: Activity },
  { id: 'verdict', label: 'AI Verdict', icon: Sparkles },
]

function initSessions(): { sessions: Session[]; activeId: string } {
  let sessions = loadSessions()

  // Migrate pre-session localStorage data into a first session
  if (sessions.length === 0) {
    const legacy = {
      answers: (() => { try { return JSON.parse(localStorage.getItem('fde-answers') || 'null') } catch { return null } })(),
      meta: (() => { try { return JSON.parse(localStorage.getItem('fde-meta') || 'null') } catch { return null } })(),
    }
    const first = createSession()
    if (legacy.answers) first.answers = legacy.answers
    if (legacy.meta) first.meta = { ...first.meta, ...legacy.meta }
    sessions = [first]
    saveSessions(sessions)
  }

  const storedId = getActiveId()
  const activeId = sessions.find(s => s.id === storedId)?.id ?? sessions[0].id
  setActiveId(activeId)
  return { sessions, activeId }
}

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<Tab>('mission')
  const [llmConfig, setLLMConfig] = useLocalStorage<LLMConfig>('fde-llm-config', {
    provider: 'anthropic',
    anthropicKey: '',
    localBaseUrl: 'http://localhost:1234/v1',
    localModel: 'llama-3.2-11b-instruct',
  })
  const [scriptsOpen, setScriptsOpen] = useLocalStorage<boolean>('fde-scripts-open', true)
  const [confidence, setConfidence] = useLocalStorage<Record<string, 'high' | 'medium' | 'low' | 'none'>>('fde-confidence', {})

  const [sessions, setSessions] = useState<Session[]>(() => initSessions().sessions)
  const [activeSessionId, setActiveSessionId] = useState<string>(() => initSessions().activeId)
  const [folderHandle, setFolderHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [folderName, setFolderName] = useState<string | null>(null)
  const folderRef = useRef<FileSystemDirectoryHandle | null>(null)
  folderRef.current = folderHandle

  // On mount: restore saved folder handle if permission still valid
  useEffect(() => {
    if (!isSupported()) return
    getSavedHandle().then(async handle => {
      if (handle) {
        setFolderHandle(handle)
        setFolderName(await getFolderName(handle))
        // Reload sessions from folder (may have files from another device/session)
        const fileSessions = await loadSessionsFromFolder(handle)
        if (fileSessions.length > 0) {
          saveSessions(fileSessions)
          setSessions(fileSessions)
          const storedId = getActiveId()
          const activeId = fileSessions.find(s => s.id === storedId)?.id ?? fileSessions[fileSessions.length - 1].id
          setActiveSessionId(activeId)
          setActiveId(activeId)
        }
      }
    })
  }, [])

  const activeSession = sessions.find(s => s.id === activeSessionId) ?? sessions[0]

  // Auto-save to localStorage + file system whenever session changes
  const updateSession = useCallback((patch: Partial<Session>) => {
    setSessions(prev => {
      const next = prev.map(s =>
        s.id === activeSessionId
          ? { ...s, ...patch, updatedAt: new Date().toISOString() }
          : s
      )
      saveSessions(next)
      // Also write to file if folder connected
      const updated = next.find(s => s.id === activeSessionId)
      if (updated && folderRef.current) {
        writeSession(folderRef.current, updated).catch(() => {})
      }
      return next
    })
  }, [activeSessionId])

  // Convenience setters
  const setMeta = (meta: Session['meta']) => updateSession({ meta })
  const setAnswers = (answers: Session['answers']) => updateSession({ answers })
  const setTriggeredFlags = (triggeredFlags: Session['triggeredFlags']) => updateSession({ triggeredFlags })
  const setRubricScores = (rubricScores: Session['rubricScores']) => updateSession({ rubricScores })
  const setScorecardScores = (scorecardScores: Session['scorecardScores']) => updateSession({ scorecardScores })
  const setScorecardNotes = (scorecardNotes: Session['scorecardNotes']) => updateSession({ scorecardNotes })
  const setVerdict = (verdict: Session['verdict']) => updateSession({ verdict })

  const handleConnectFolder = async () => {
    const handle = await pickFolder()
    if (!handle) return
    setFolderHandle(handle)
    setFolderName(await getFolderName(handle))
    // Write all existing sessions to the new folder
    for (const s of sessions) {
      await writeSession(handle, s).catch(() => {})
    }
  }

  const handleDisconnectFolder = async () => {
    await clearSavedHandle()
    setFolderHandle(null)
    setFolderName(null)
  }

  const handleSwitchSession = (id: string) => {
    setActiveId(id)
    setActiveSessionId(id)
  }

  const handleCreateSession = (nameData?: string) => {
    const s = createSession()
    if (nameData) {
      try {
        const { customer, useCase } = JSON.parse(nameData)
        if (customer) s.meta.customerName = customer
        if (useCase) s.meta.useCaseName = useCase
      } catch {}
    }
    const next = [...sessions, s]
    saveSessions(next)
    setSessions(next)
    if (folderRef.current) writeSession(folderRef.current, s).catch(() => {})
    setActiveId(s.id)
    setActiveSessionId(s.id)
    setActiveTab('mission')
  }

  const handleRenameSession = (id: string, customerName: string, useCaseName: string) => {
    setSessions(prev => {
      const next = prev.map(s =>
        s.id === id
          ? { ...s, meta: { ...s.meta, customerName, useCaseName }, updatedAt: new Date().toISOString() }
          : s
      )
      saveSessions(next)
      const updated = next.find(s => s.id === id)
      if (updated && folderRef.current) writeSession(folderRef.current, updated).catch(() => {})
      return next
    })
    // If renaming the active session, sync meta bar too
    if (id === activeSessionId) {
      setMeta({ ...activeSession.meta, customerName, useCaseName })
    }
  }

  const handleDuplicateSession = (s: Session) => {
    const dup = duplicateSession(s)
    const next = [...sessions, dup]
    saveSessions(next)
    setSessions(next)
    if (folderRef.current) writeSession(folderRef.current, dup).catch(() => {})
    setActiveId(dup.id)
    setActiveSessionId(dup.id)
  }

  const handleDeleteSession = (id: string) => {
    const session = sessions.find(s => s.id === id)
    const next = sessions.filter(s => s.id !== id)
    saveSessions(next)
    setSessions(next)
    if (session && folderRef.current) deleteSessionFile(folderRef.current, session).catch(() => {})
    if (activeSessionId === id) {
      const newActive = next[next.length - 1]?.id ?? ''
      setActiveId(newActive)
      setActiveSessionId(newActive)
    }
  }

  const { meta, answers, triggeredFlags, rubricScores, scorecardScores, scorecardNotes, verdict } = activeSession

  const criticalFlags = triggeredFlags.filter(id => redFlags.find(f => f.id === id)?.severity === 'critical').length
  const rubricTotal = rubricDimensions.reduce((sum, d) => sum + (rubricScores[d.id] || 0) * d.weight, 0)
  const rubricPct = Math.round((rubricTotal / MAX_RUBRIC_SCORE) * 100)
  const avgScorecard = Math.round(scorecardDomains.reduce((sum, d) => sum + (scorecardScores[d.id] || 0), 0) / scorecardDomains.length)

  return (
    <div className="min-h-screen theme-base theme-text">
      {/* Top header */}
      <header className="border-b theme-border theme-header backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
                <Sparkles size={16} className="text-accent" />
              </div>
              <div className="hidden sm:block">
                <div className="font-semibold theme-text text-sm">FDE Agent Discovery</div>
                <div className="text-xs theme-muted">Agentic Push-to-Prod Evaluator</div>
              </div>
            </div>

            {/* Session manager + folder status — centre */}
            <div className="flex-1 flex items-center justify-center gap-3">
              <SessionManager
                sessions={sessions}
                activeId={activeSessionId}
                onSwitch={handleSwitchSession}
                onCreate={handleCreateSession}
                onDuplicate={handleDuplicateSession}
                onDelete={handleDeleteSession}
                onRename={handleRenameSession}
              />
              {isSupported() && (
                <FolderStatus
                  folderName={folderName}
                  onConnect={handleConnectFolder}
                  onDisconnect={handleDisconnectFolder}
                />
              )}
            </div>

            {/* Live stats + controls */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="hidden lg:flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Flag size={12} className={criticalFlags >= 2 ? 'text-stop' : criticalFlags >= 1 ? 'text-caution' : 'text-muted'} />
                  <span className="text-xs font-mono">
                    <span className={criticalFlags >= 2 ? 'text-stop font-bold' : 'theme-text'}>{triggeredFlags.length}</span>
                    <span className="theme-muted">/22</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BarChart3 size={12} className="theme-muted" />
                  <span className="text-xs font-mono theme-text">{rubricPct}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity size={12} className="theme-muted" />
                  <span className="text-xs font-mono theme-text">{avgScorecard || '—'}<span className="theme-muted">/25</span></span>
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

              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border theme-border theme-panel hover:border-accent/50 transition-colors text-xs theme-muted hover:text-accent"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Meta bar */}
      <div className="border-b theme-border theme-meta">
        <div className="max-w-6xl mx-auto px-6 py-2.5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 size={13} className="text-muted shrink-0" />
              <input type="text" placeholder="Customer name" value={meta.customerName}
                onChange={e => setMeta({ ...meta, customerName: e.target.value })}
                className="flex-1 min-w-0 bg-transparent text-sm theme-text placeholder:text-slate-500 border-none outline-none" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Layers size={13} className="text-muted shrink-0" />
              <input type="text" placeholder="Use case name" value={meta.useCaseName}
                onChange={e => setMeta({ ...meta, useCaseName: e.target.value })}
                className="flex-1 min-w-0 bg-transparent text-sm theme-text placeholder:text-slate-500 border-none outline-none" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <User size={13} className="text-muted shrink-0" />
              <input type="text" placeholder="FDE name" value={meta.fde}
                onChange={e => setMeta({ ...meta, fde: e.target.value })}
                className="flex-1 min-w-0 bg-transparent text-sm theme-text placeholder:text-slate-500 border-none outline-none" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Calendar size={13} className="text-muted shrink-0" />
              <input type="date" value={meta.date}
                onChange={e => setMeta({ ...meta, date: e.target.value })}
                className="flex-1 min-w-0 bg-transparent text-sm theme-text border-none outline-none" />
            </div>
          </div>
          <div className="flex items-start gap-2 border-t theme-border pt-2">
            <FileText size={13} className="text-muted shrink-0 mt-0.5" />
            <textarea rows={2}
              placeholder="Use case summary — describe the process being automated, the business problem, and why AI is the right tool. This feeds directly into the AI Verdict prompt."
              value={meta.useCaseSummary}
              onChange={e => setMeta({ ...meta, useCaseSummary: e.target.value })}
              className="flex-1 bg-transparent text-sm theme-text placeholder:text-slate-500 border-none outline-none resize-none leading-relaxed" />
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
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                    active ? 'border-accent text-accent font-semibold' : 'border-transparent theme-muted hover:theme-text hover:border-border'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  {tab.id === 'redflags' && triggeredFlags.length > 0 && (
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded-full ${
                      criticalFlags >= 2 ? 'bg-stop/20 text-stop' : 'bg-caution/20 text-caution'
                    }`}>{triggeredFlags.length}</span>
                  )}
                  {tab.id === 'verdict' && verdict && <span className="w-1.5 h-1.5 rounded-full bg-go" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'mission' && (
          <MissionControlTab meta={meta} answers={answers} triggeredFlags={triggeredFlags}
            rubricScores={rubricScores} scorecardScores={scorecardScores} verdict={verdict} />
        )}
        {activeTab === 'qualification' && (
          <QualificationTab answers={answers} setAnswers={setAnswers}
            confidence={confidence} setConfidence={setConfidence}
            scriptsOpen={scriptsOpen} setScriptsOpen={setScriptsOpen}
            llmConfig={llmConfig} />
        )}
        {activeTab === 'redflags' && (
          <RedFlagsTab triggeredFlags={triggeredFlags} setTriggeredFlags={setTriggeredFlags}
            answers={answers} llmConfig={llmConfig} />
        )}
        {activeTab === 'rubric' && (
          <RubricTab scores={rubricScores} setScores={setRubricScores} />
        )}
        {activeTab === 'scorecard' && (
          <ScorecardTab scores={scorecardScores} setScores={setScorecardScores}
            notes={scorecardNotes} setNotes={setScorecardNotes} />
        )}
        {activeTab === 'verdict' && (
          <VerdictTab meta={meta} answers={answers} triggeredFlags={triggeredFlags}
            rubricScores={rubricScores} scorecardScores={scorecardScores} scorecardNotes={scorecardNotes}
            llmConfig={llmConfig} setLLMConfig={setLLMConfig} verdict={verdict} setVerdict={setVerdict} />
        )}
      </main>
    </div>
  )
}
