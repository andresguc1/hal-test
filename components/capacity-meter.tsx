import { cn } from '@/lib/utils'

const SEGMENTS = 20

/**
 * The signature element: a ledger-style segmented meter of how much of a
 * job's application capacity has been used. Numbers are always shown in text;
 * the bar is decorative reinforcement.
 */
export function CapacityMeter({ used, max, size = 'sm' }: { used: number; max: number; size?: 'sm' | 'lg' }) {
  const ratio = max > 0 ? Math.min(used / max, 1) : 0
  const filled = Math.round(ratio * SEGMENTS)
  const full = used >= max
  const nearlyFull = !full && ratio >= 0.85

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn('text-muted-foreground', size === 'lg' ? 'text-sm' : 'text-xs')}>Applications</span>
        <span className={cn('font-mono tabular-nums', size === 'lg' ? 'text-base' : 'text-sm', full && 'text-caution')}>
          {used} / {max}
          {full && <span className="ml-2 text-xs">limit reached</span>}
        </span>
      </div>
      <div
        role="meter"
        aria-label="Application capacity used"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={used}
        aria-valuetext={`${used} of ${max} applications`}
        className={cn('flex gap-0.5', size === 'lg' ? 'h-2.5' : 'h-1.5')}
      >
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            className={cn(
              'flex-1 rounded-[1px]',
              i < filled ? (full || nearlyFull ? 'bg-caution' : 'bg-primary') : 'bg-muted',
            )}
          />
        ))}
      </div>
    </div>
  )
}
