type Gate = 'PUSH TO PROD' | 'CONDITIONAL' | 'PAUSE' | 'NO-GO'

const gateStyles: Record<Gate, { color: string; bg: string; border: string }> = {
  'PUSH TO PROD': { color: 'text-go', bg: 'bg-go/10', border: 'border-go/40' },
  'CONDITIONAL': { color: 'text-caution', bg: 'bg-caution/10', border: 'border-caution/40' },
  'PAUSE': { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/40' },
  'NO-GO': { color: 'text-stop', bg: 'bg-stop/10', border: 'border-stop/40' },
}

export function GateBadge({ gate }: { gate: Gate }) {
  const s = gateStyles[gate]
  return (
    <span className={`inline-flex items-center px-4 py-1.5 rounded-full border text-sm font-mono font-bold tracking-widest ${s.color} ${s.bg} ${s.border}`}>
      {gate}
    </span>
  )
}
