import type { VerdictResult } from './aiVerdict'

export interface Session {
  id: string
  createdAt: string
  updatedAt: string
  meta: { customerName: string; useCaseName: string; date: string; fde: string; useCaseSummary: string }
  answers: Record<string, string>
  triggeredFlags: string[]
  rubricScores: Record<string, number>
  scorecardScores: Record<string, number>
  scorecardNotes: Record<string, string>
  verdict: VerdictResult | null
}

const SESSIONS_KEY = 'fde-sessions'
const ACTIVE_KEY = 'fde-active-session-id'

export function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveSessions(sessions: Session[]) {
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions)) } catch {}
}

export function getActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}

export function setActiveId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id)
}

export function sessionLabel(s: Session): string {
  const parts = [s.meta.customerName, s.meta.useCaseName].filter(Boolean)
  return parts.length > 0 ? parts.join(' — ') : 'Untitled Session'
}

export function createSession(): Session {
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    meta: { customerName: '', useCaseName: '', date: new Date().toISOString().split('T')[0], fde: '', useCaseSummary: '' },
    answers: {},
    triggeredFlags: [],
    rubricScores: {},
    scorecardScores: {},
    scorecardNotes: {},
    verdict: null,
  }
}

export function duplicateSession(s: Session): Session {
  return {
    ...JSON.parse(JSON.stringify(s)),
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    meta: { ...s.meta, customerName: `${s.meta.customerName} (copy)` },
    verdict: null,
  }
}
