export function formatSalary(j: {
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  salary_period: string | null
}): string | null {
  if (j.salary_min == null) return null
  const cur = j.salary_currency ?? 'USD'
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
  const range = j.salary_max != null && j.salary_max !== j.salary_min ? `${fmt(j.salary_min)} – ${fmt(j.salary_max)}` : fmt(j.salary_min)
  const per = j.salary_period === 'YEAR' ? ' / year' : j.salary_period === 'MONTH' ? ' / month' : ''
  return `${range} ${cur}${per}`
}

export function relativeDays(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

export function untilDays(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const ms = d.getTime() - Date.now()
  if (ms <= 0) return 'passed'
  const days = Math.ceil(ms / 86_400_000)
  return days === 1 ? 'in 1 day' : `in ${days} days`
}

export function shortDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function pct(v: number | null | undefined): string {
  return v == null ? '—' : `${Math.round(v * 100)}%`
}
