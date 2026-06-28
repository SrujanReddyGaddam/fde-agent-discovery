import { useState } from 'react'
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react'
import { sections } from '../../data/inquiryGuide'
import { ScriptToggle } from '../ui/ScriptToggle'

interface Props {
  answers: Record<string, string>
  setAnswers: (answers: Record<string, string>) => void
}

export function QualificationTab({ answers, setAnswers }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ A: true })

  const toggleSection = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const setAnswer = (id: string, value: string) => {
    setAnswers({ ...answers, [id]: value })
  }

  const getSectionCompletion = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return 0
    const filled = section.questions.filter(q => answers[q.id]?.trim()).length
    return Math.round((filled / section.questions.length) * 100)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold theme-text">Discovery Questionnaire</h2>
          <p className="text-sm text-muted mt-1">Sections A–J from the FDE Use Case Inquiry Guide. Click each section to expand.</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-accent">
            {sections.reduce((sum, s) => sum + s.questions.filter(q => answers[q.id]?.trim()).length, 0)}
            <span className="text-muted text-base font-normal">
              /{sections.reduce((sum, s) => sum + s.questions.length, 0)}
            </span>
          </div>
          <div className="text-xs text-muted">questions answered</div>
        </div>
      </div>

      {sections.map(section => {
        const pct = getSectionCompletion(section.id)
        const isOpen = expanded[section.id]
        return (
          <div key={section.id} className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center gap-3 px-5 py-4 theme-panel theme-tab-hover transition-colors text-left"
            >
              <span className="font-mono text-accent font-bold text-sm w-5">{section.id}</span>
              <span className="flex-1 theme-text font-medium">{section.label.replace(`${section.id}. `, '')}</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct === 100 ? '#22c55e' : pct > 0 ? '#3B82F6' : '#1e2d45',
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted font-mono">{pct}%</span>
                </div>
                {isOpen ? <ChevronDown size={16} className="text-muted" /> : <ChevronRight size={16} className="text-muted" />}
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 pt-3 space-y-6 theme-surface border-t theme-border">
                <p className="text-xs text-muted italic">{section.goal}</p>

                {section.questions.map(q => (
                  <div key={q.id} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-xs text-accent mt-0.5 shrink-0">{q.id}</span>
                      <div className="flex-1">
                        <label className="block text-sm font-medium theme-text leading-snug">
                          {q.question}
                        </label>

                        {/* Metadata row */}
                        <div className="flex flex-wrap gap-3 mt-1.5">
                          <div className="flex items-center gap-1 text-xs text-go">
                            <CheckCircle size={11} />
                            <span className="theme-muted">{q.goodSignal}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-stop mt-0.5">
                          <AlertTriangle size={11} />
                          <span className="theme-muted italic">{q.redFlag}</span>
                        </div>

                        <ScriptToggle script={q.script} />

                        <textarea
                          rows={3}
                          placeholder="Your notes..."
                          value={answers[q.id] || ''}
                          onChange={e => setAnswer(q.id, e.target.value)}
                          className="mt-3 w-full theme-input theme-text border theme-border rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-400 resize-y focus:border-accent/60 focus:ring-1 focus:ring-accent/20 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
