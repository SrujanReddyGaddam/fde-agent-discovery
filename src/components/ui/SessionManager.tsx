import { useState, useRef, useEffect } from 'react'
import { Plus, ChevronDown, Copy, Trash2, Clock, Check } from 'lucide-react'
import type { Session } from '../../lib/sessionManager'
import { sessionLabel } from '../../lib/sessionManager'

interface Props {
  sessions: Session[]
  activeId: string
  onSwitch: (id: string) => void
  onCreate: () => void
  onDuplicate: (s: Session) => void
  onDelete: (id: string) => void
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function SessionManager({ sessions, activeId, onSwitch, onCreate, onDuplicate, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const active = sessions.find(s => s.id === activeId)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border theme-border theme-panel hover:border-accent/50 transition-colors max-w-52 group"
      >
        <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
        <span className="text-sm theme-text truncate font-medium">
          {active ? sessionLabel(active) : 'No session'}
        </span>
        <ChevronDown size={13} className={`theme-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-80 theme-panel border theme-border rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b theme-border">
            <span className="text-xs font-semibold theme-muted uppercase tracking-wider">Sessions</span>
            <button
              onClick={() => { onCreate(); setOpen(false) }}
              className="flex items-center gap-1.5 text-xs text-accent hover:text-blue-300 transition-colors font-medium"
            >
              <Plus size={12} />
              New Session
            </button>
          </div>

          {/* Session list */}
          <div className="max-h-72 overflow-y-auto">
            {sessions.length === 0 && (
              <div className="px-4 py-6 text-center text-xs theme-muted">No sessions yet</div>
            )}
            {[...sessions].reverse().map(session => {
              const isActive = session.id === activeId
              const label = sessionLabel(session)
              const answeredCount = Object.values(session.answers).filter(v => v?.trim()).length
              const flagCount = session.triggeredFlags.length

              return (
                <div
                  key={session.id}
                  className={`group/item flex items-start gap-3 px-4 py-3 border-b theme-border last:border-0 cursor-pointer transition-colors ${
                    isActive ? 'bg-accent/5' : 'hover:theme-surface'
                  }`}
                  onClick={() => { if (!isActive) { onSwitch(session.id); setOpen(false) } }}
                >
                  <div className="mt-0.5 shrink-0">
                    {isActive
                      ? <Check size={14} className="text-accent" />
                      : <div className="w-3.5 h-3.5 rounded-full border-2 border-border" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${isActive ? 'text-accent' : 'theme-text'}`}>
                      {label}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs theme-muted">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {timeAgo(session.updatedAt)}
                      </span>
                      {answeredCount > 0 && <span>{answeredCount} answers</span>}
                      {flagCount > 0 && <span className="text-stop">{flagCount} flags</span>}
                    </div>
                    {session.meta.date && (
                      <div className="text-xs theme-muted mt-0.5">{session.meta.date}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); onDuplicate(session); setOpen(false) }}
                      className="p-1 rounded theme-muted hover:text-accent transition-colors"
                      title="Duplicate"
                    >
                      <Copy size={12} />
                    </button>
                    {sessions.length > 1 && (
                      confirmDelete === session.id ? (
                        <button
                          onClick={e => { e.stopPropagation(); onDelete(session.id); setConfirmDelete(null) }}
                          className="p-1 rounded text-stop hover:bg-stop/10 transition-colors text-xs font-bold"
                          title="Confirm delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); setConfirmDelete(session.id) }}
                          className="p-1 rounded theme-muted hover:text-stop transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-4 py-2 border-t theme-border text-xs theme-muted">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} · auto-saved
          </div>
        </div>
      )}
    </div>
  )
}
