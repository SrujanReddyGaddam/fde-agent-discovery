interface TierBadgeProps {
  score: number
}

function getTier(score: number) {
  if (score === 0) return { label: 'Not Scored', color: 'text-muted bg-muted/10 border-muted/30' }
  if (score <= 7) return { label: 'Below Baseline', color: 'text-stop bg-stop/10 border-stop/30' }
  if (score <= 14) return { label: 'Baseline', color: 'text-caution bg-caution/10 border-caution/30' }
  if (score <= 20) return { label: 'Strong', color: 'text-go bg-go/10 border-go/30' }
  return { label: 'Elite', color: 'text-accent bg-accent/10 border-accent/30' }
}

export function TierBadge({ score }: TierBadgeProps) {
  const { label, color } = getTier(score)
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono font-semibold ${color}`}>
      {label}
    </span>
  )
}
