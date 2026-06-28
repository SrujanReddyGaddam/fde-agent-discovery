import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (!item) return initialValue
      const parsed = JSON.parse(item)
      // merge stored value with initialValue so new keys get their defaults
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return { ...initialValue, ...parsed } as T
      }
      return parsed as T
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch {
      // quota exceeded — silently fail
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue] as const
}
