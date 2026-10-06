import Link from 'next/link'
import { informationBar } from '@/lib/services/analytics'

/** Neutral market statements. Renders nothing when there is no data to back a statement. */
export async function InfoBar() {
  const bar = await informationBar().catch(() => ({ statements: [] as string[], generatedAt: '' }))
  if (bar.statements.length === 0) return null
  return (
    <aside aria-label="Market signals" className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-2.5 text-sm text-muted-foreground md:flex-row md:items-center md:gap-6">
        <ul className="flex flex-1 flex-col gap-1 md:flex-row md:flex-wrap md:gap-x-6">
          {bar.statements.slice(0, 2).map((s) => (
            <li key={s} className="text-pretty">
              {s}
            </li>
          ))}
        </ul>
        <Link href="/market" className="shrink-0 text-primary hover:underline">
          Full market data
        </Link>
      </div>
    </aside>
  )
}
