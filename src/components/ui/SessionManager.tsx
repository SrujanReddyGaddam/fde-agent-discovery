import { useState, useRef, useEffect } from 'react'
import { Plus, ChevronDown, Copy, Trash2, Clock, Check, Pencil } from 'lucide-react'
import type { Session } from '../../lib/sessionManager'
import { sessionLabel } from '../../lib/sessionManager'

interface Props {
  sessions: Session[]
  activeId: string
  onSwitch: (id: string) => void
  onCreate: (name?: string) => void
  onDuplicate: (s: Session) => void
  onDelete: (id: string) => void
  onRename: (id: string, customerName: string, useCaseName: string) => void
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

function NewSessionModal({ onConfirm, onCancel }: { onConfirm: (customer: string, useCase: string) => void; onCancel: () => void }) {
  const [customer, setCustomer] = useState('')
  const [useCase, setUseCase] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = () => {
    onConfirm(customer.trim(), useCase.trim())
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="theme-panel border theme-border rounded-2xl p-6 w-96 shadow-2xl">
        <h3 className="font-semibold theme-text text-base mb-4">New Discovery Session</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs theme-muted block mb-1">Customer Name</label>
            <input
              ref={inputRef}
              type="text"
              placeholder="e.g. Acme Corp"
              value={customer}
              onChange={e => setCustomer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="w-full theme-input theme-text border theme-border rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:border-accent/60 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs theme-muted block mb-1">Use Case Name</label>
            <input
              type="text"
              placeholder="e.g. Claims Denial Processing"
              value={useCase}
              onChange={e => setUseCase(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="w-full theme-input theme-text border theme-border rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:border-accent/60 outline-none transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={submit}
            className="flex-1 bg-accent hover:bg-blue-500 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            Create Session
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 theme-panel border theme-border rounded-lg text-sm theme-muted hover:theme-text transition-colors"
          >
            Cancel
          </button>
        </div>
        <p className="text-xs theme-muted mt-3 text-center">You can edit these fields anytime in the meta bar</p>
      </div>
    </div>
  )
}

function RenameModal({ session, onConfirm, onCancel }: {
  session: Session
  onConfirm: (customer: string, useCase: string) => void
  onCancel: () => void
}) {
  const [customer, setCustomer] = useState(session.meta.customerName)
  const [useCase, setUseCase] = useState(session.meta.useCaseName)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = () => onConfirm(customer.trim(), useCase.trim())

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="theme-panel border theme-border rounded-2xl p-6 w-96 shadow-2xl">
        <h3 className="font-semibold theme-text text-base mb-4">Rename Session</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs theme-muted block mb-1">Customer Name</label>
            <input
              ref={inputRef}
              type="text"
              value={customer}
              onChange={e => setCustomer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="w-full theme-input theme-text border theme-border rounded-lg px-3 py-2 text-sm focus:border-accent/60 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs theme-muted block mb-1">Use Case Name</label>
            <input
              type="text"
              value={useCase}
              onChange={e => setUseCase(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="w-full theme-input theme-text border theme-border rounded-lg px-3 py-2 text-sm focus:border-accent/60 outline-none transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={submit} className="flex-1 bg-accent hover:bg-blue-500 text-white font-semibold py-2 rounded-lg text-sm transition-colors">
            Save
          </button>
          <button onClick={onCancel} className="px-4 py-2 theme-panel border theme-border rounded-lg text-sm theme-muted hover:theme-text transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export function SessionManager({ sessions, activeId, onSwitch, onCreate, onDuplicate, onDelete, onRename }: Props) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Session | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirmDelete(null)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const active = sessions.find(s => s.id === activeId)

  const handleCreate = () => {
    setOpen(false)
    setShowNewModal(true)
  }

  return (
    <>
      {showNewModal && (
        <NewSessionModal
          onConfirm={(customer, useCase) => {
            setShowNewModal(false)
            onCreate(JSON.stringify({ customer, useCase }))
          }}
          onCancel={() => setShowNewModal(false)}
        />
      )}
      {renameTarget && (
        <RenameModal
          session={renameTarget}
          onConfirm={(customer, useCase) => {
            onRename(renameTarget.id, customer, useCase)
            setRenameTarget(null)
          }}
          onCancel={() => setRenameTarget(null)}
        />
      )}

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
            <div className="flex items-center justify-between px-4 py-3 border-b theme-border">
              <span className="text-xs font-semibold theme-muted uppercase tracking-wider">Sessions</span>
              <button
                onClick={handleCreate}
                className="flex items-center gap-1.5 text-xs text-accent hover:text-blue-300 transition-colors font-medium"
              >
                <Plus size={12} />
                New Session
              </button>
            </div>

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

                    <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); setRenameTarget(session); setOpen(false) }}
                        className="p-1 rounded theme-muted hover:text-accent transition-colors"
                        title="Rename"
                      >
                        <Pencil size={12} />
                      </button>
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
                            className="p-1 rounded text-stop hover:bg-stop/10 transition-colors"
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
    </>
  )
}
