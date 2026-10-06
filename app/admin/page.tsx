import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AdminCompanyActions, AdminReportActions, AdminUserActions } from '@/components/admin-actions'
import { TollAIScript } from '@/components/tollai-script'
import { REPORT_CATEGORY_LABELS, type ReportCategory } from '@/lib/config/platform'
import { relativeDays } from '@/lib/format'
import { adminAuditLog, adminCompanies, adminFlaggedJobs, adminRestrictedUsers, adminSecurityEvents } from '@/lib/services/queries'
import { adminReportQueue } from '@/lib/services/reports'
import { getViewer } from '@/lib/viewer'

export const metadata: Metadata = { title: 'Trust & Safety', robots: { index: false } }

const TABS = ['reports', 'companies', 'jobs', 'users', 'security', 'audit'] as const
type Tab = (typeof TABS)[number]

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const viewer = await getViewer()
  if (!viewer) redirect('/sign-in?next=/admin')
  if (viewer.role !== 'ADMIN') notFound()
  const { tab: raw } = await searchParams
  const tab: Tab = TABS.includes(raw as Tab) ? (raw as Tab) : 'reports'

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
      <TollAIScript />
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Trust &amp; Safety</h1>
        <p className="text-sm text-muted-foreground">A report is not proof. Every action here is audited and can be appealed.</p>
      </header>
      <nav aria-label="Admin sections" className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin?tab=${t}`}
            aria-current={t === tab ? 'page' : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm capitalize ${t === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t}
          </Link>
        ))}
      </nav>
      {tab === 'reports' && <Reports />}
      {tab === 'companies' && <Companies />}
      {tab === 'jobs' && <FlaggedJobs />}
      {tab === 'users' && <Users />}
      {tab === 'security' && <Security />}
      {tab === 'audit' && <Audit />}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{children}</p>
}

async function Reports() {
  const queue = await adminReportQueue()
  if (queue.length === 0) return <Empty>No open reports.</Empty>
  return (
    <ul className="flex flex-col gap-3">
      {queue.map((r) => (
        <li key={r.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{REPORT_CATEGORY_LABELS[r.category as ReportCategory] ?? r.category}</span>
              <span className="text-sm text-muted-foreground">
                {r.company_name ?? 'Community job'}
                {r.job_title && ` · ${r.job_title}`} · {relativeDays(r.created_at)}
              </span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{r.status.replace('_', ' ')}</span>
          </div>
          <p className="text-pretty text-sm leading-relaxed">{r.description}</p>
          <dl className="grid gap-x-6 gap-y-1 rounded-md bg-secondary p-3 font-mono text-xs sm:grid-cols-2 lg:grid-cols-4">
            <Pair k="weight" v={r.weight.toFixed(2)} />
            <Pair k="reporter trust" v={r.reporter_trust ?? 'NORMAL'} />
            <Pair k="reporter age" v={`${r.reporter_age_days}d`} />
            <Pair k="company reports" v={String(r.company_report_count)} />
            <Pair k="company weight 30d" v={r.company_weight_30d.toFixed(1)} />
            {Object.entries(r.evidence).map(([k, v]) => (
              <Pair key={k} k={k} v={String(v ?? '—')} />
            ))}
          </dl>
          <AdminReportActions reportId={r.id} />
        </li>
      ))}
    </ul>
  )
}

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex min-w-0 gap-2">
      <dt className="shrink-0 text-muted-foreground">{k}</dt>
      <dd className="truncate">{v}</dd>
    </div>
  )
}

async function Companies() {
  const rows = await adminCompanies()
  if (rows.length === 0) return <Empty>No companies registered.</Empty>
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((c) => (
        <li key={c.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{c.name}</span>
              <a href={c.website} target="_blank" rel="noopener noreferrer nofollow" className="text-sm text-primary hover:underline">
                {c.domain}
              </a>
            </div>
            <span className="font-mono text-xs">
              {c.status}
              {c.restriction !== 'NONE' && ` · ${c.restriction}`}
            </span>
          </div>
          <code className="block overflow-x-auto rounded-md bg-secondary p-2 font-mono text-xs">{JSON.stringify(c.evidence)}</code>
          <AdminCompanyActions companyId={c.id} />
        </li>
      ))}
    </ul>
  )
}

async function FlaggedJobs() {
  const rows = await adminFlaggedJobs()
  if (rows.length === 0) return <Empty>No flagged jobs.</Empty>
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {rows.map((j) => (
        <li key={j.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
          <Link href={`/jobs/${j.id}`} className="hover:text-primary">
            {j.title} <span className="text-muted-foreground">· {j.companyName}</span>
          </Link>
          <span className="font-mono text-xs text-caution">{j.flags.join(', ')}</span>
        </li>
      ))}
    </ul>
  )
}

async function Users() {
  const rows = await adminRestrictedUsers()
  if (rows.length === 0) return <Empty>No accounts outside the normal trust state.</Empty>
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((u) => (
        <li key={u.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap justify-between gap-3 text-sm">
            <span>
              {u.name} <span className="text-muted-foreground">· {u.role}</span>
            </span>
            <span className="font-mono text-xs">{u.trustState}</span>
          </div>
          <AdminUserActions userId={u.id} />
        </li>
      ))}
    </ul>
  )
}

async function Security() {
  const { recent, summary } = await adminSecurityEvents()
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Security telemetry is separate from hiring analytics. A passed challenge does not make a candidate trustworthy; a failed one does not make
        them malicious.
      </p>
      <section aria-label="Last 24 hours" className="flex flex-wrap gap-2">
        {summary.length === 0 ? (
          <span className="text-sm text-muted-foreground">No security events in the last 24 hours.</span>
        ) : (
          summary.map((s) => (
            <span key={s.type} className="rounded-md border border-border bg-card px-3 py-1.5 font-mono text-xs">
              {s.type} <span className="text-primary">{s.n}</span>
            </span>
          ))
        )}
      </section>
      {recent.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full font-mono text-xs">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="p-2 font-normal">type</th>
                <th className="p-2 font-normal">route</th>
                <th className="p-2 font-normal">decision</th>
                <th className="p-2 font-normal">ip hash</th>
                <th className="p-2 font-normal">when</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.map((e) => (
                <tr key={e.id}>
                  <td className="p-2">{e.type}</td>
                  <td className="p-2">
                    {e.method} {e.path}
                  </td>
                  <td className="p-2">{e.decision}</td>
                  <td className="p-2 text-muted-foreground">{e.ipHash?.slice(0, 10) ?? '—'}</td>
                  <td className="p-2 text-muted-foreground">{relativeDays(e.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

async function Audit() {
  const rows = await adminAuditLog()
  if (rows.length === 0) return <Empty>No administrative actions recorded yet.</Empty>
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card font-mono text-xs">
      {rows.map((r) => (
        <li key={r.id} className="flex flex-col gap-1 p-3">
          <div className="flex flex-wrap justify-between gap-2">
            <span>
              {r.action} <span className="text-muted-foreground">→ {r.targetType}:{r.targetId.slice(0, 8)}</span>
            </span>
            <span className="text-muted-foreground">
              {r.actorId === 'SYSTEM' ? 'system' : r.actorId.slice(0, 8)} · {relativeDays(r.createdAt)}
            </span>
          </div>
          <span className="font-sans text-sm text-muted-foreground">{r.reason}</span>
        </li>
      ))}
    </ul>
  )
}
