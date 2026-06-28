import { useState } from 'react'
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'

interface ScriptToggleProps {
  script: string
}

export function ScriptToggle({ script }: ScriptToggleProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-accent hover:text-blue-300 transition-colors"
      >
        <MessageSquare size={12} />
        <span>Conversational Script</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="mt-2 p-3 theme-script border rounded-lg text-sm italic leading-relaxed">
          {script}
        </div>
      )}
    </div>
  )
}
