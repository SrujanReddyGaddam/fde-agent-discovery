import { useState, useEffect } from 'react'
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'

interface ScriptToggleProps {
  script: string
  open: boolean  // global toggle drives the default; individual click overrides locally
}

export function ScriptToggle({ script, open: globalOpen }: ScriptToggleProps) {
  const [localOpen, setLocalOpen] = useState(globalOpen)

  // When global toggle changes, snap all scripts to that state
  useEffect(() => {
    setLocalOpen(globalOpen)
  }, [globalOpen])

  return (
    <div className="mt-2">
      <button
        onClick={() => setLocalOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-accent hover:text-blue-300 transition-colors"
      >
        <MessageSquare size={12} />
        <span>Conversational Script</span>
        {localOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {localOpen && (
        <div className="mt-2 p-3 theme-script border rounded-lg text-sm italic leading-relaxed">
          {script}
        </div>
      )}
    </div>
  )
}
