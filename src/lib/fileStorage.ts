import type { Session } from './sessionManager'
import { sessionLabel } from './sessionManager'

const IDB_NAME = 'fde-discovery'
const IDB_STORE = 'handles'
const HANDLE_KEY = 'session-folder'

// ── IndexedDB helpers (for persisting the directory handle) ──

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly')
    const req = tx.objectStore(IDB_STORE).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ── File System Access API ──

export function isSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

export async function pickFolder(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await (window as any).showDirectoryPicker({
      id: 'fde-sessions',
      mode: 'readwrite',
      startIn: 'documents',
    })
    await idbSet(HANDLE_KEY, handle)
    return handle
  } catch {
    return null // user cancelled
  }
}

export async function getSavedHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await idbGet<FileSystemDirectoryHandle>(HANDLE_KEY)
    if (!handle) return null
    // Verify we still have permission
    const perm = await (handle as any).queryPermission({ mode: 'readwrite' })
    if (perm === 'granted') return handle
    // Try to re-request
    const req = await (handle as any).requestPermission({ mode: 'readwrite' })
    if (req === 'granted') return handle
    return null
  } catch {
    return null
  }
}

export async function clearSavedHandle(): Promise<void> {
  await idbDelete(HANDLE_KEY)
}

export function sessionFilename(session: Session): string {
  const label = sessionLabel(session)
  const safe = label.replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/\s+/g, '-').slice(0, 60)
  return `${safe}-${session.id.slice(-6)}.json`
}

export async function writeSession(dir: FileSystemDirectoryHandle, session: Session): Promise<void> {
  const name = sessionFilename(session)
  const fh = await dir.getFileHandle(name, { create: true })
  const writable = await (fh as any).createWritable()
  await writable.write(JSON.stringify(session, null, 2))
  await writable.close()
}

export async function deleteSessionFile(dir: FileSystemDirectoryHandle, session: Session): Promise<void> {
  try {
    const name = sessionFilename(session)
    await dir.removeEntry(name)
  } catch {
    // file may not exist — ignore
  }
}

export async function loadSessionsFromFolder(dir: FileSystemDirectoryHandle): Promise<Session[]> {
  const sessions: Session[] = []
  for await (const [name, entry] of (dir as any).entries()) {
    if (entry.kind !== 'file' || !name.endsWith('.json')) continue
    try {
      const file = await (entry as FileSystemFileHandle).getFile()
      const text = await file.text()
      const session = JSON.parse(text) as Session
      // Basic validation
      if (session.id && session.meta && session.answers !== undefined) {
        sessions.push(session)
      }
    } catch {
      // skip malformed files
    }
  }
  return sessions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export async function getFolderName(dir: FileSystemDirectoryHandle): Promise<string> {
  return dir.name
}
