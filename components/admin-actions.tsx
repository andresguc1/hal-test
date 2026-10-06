'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { inputClass } from '@/components/form'
import { api, ApiClientError } from '@/lib/client/api'

function useAdminAction() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function run(path: string, body: Record<string, unknown>) {
    setPending(true)
    setError(null)
    try {
      await api(path, { body })
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.')
    } finally {
      setPending(false)
    }
  }
  return { pending, error, run }
}

function ActionForm({
  name,
  options,
  onSubmit,
  pending,
  error,
  extra,
}: {
  name: string
  options: { value: string; label: string }[]
  onSubmit: (fd: FormData) => void
  pending: boolean
  error: string | null
  extra?: React.ReactNode
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(new FormData(e.currentTarget))
      }}
      className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-start"
    >
      <label className="sr-only" htmlFor={`${name}-action`}>
        Action
      </label>
      <select id={`${name}-action`} name="action" className={`${inputClass} sm:w-56`}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {extra}
      <label className="sr-only" htmlFor={`${name}-reason`}>
        Reason (recorded in the audit log)
      </label>
      <input id={`${name}-reason`} name="reason" required minLength={10} maxLength={1000} placeholder="Reason — recorded in the audit log" className={`${inputClass} flex-1`} />
      <button type="submit" disabled={pending} className="h-10 shrink-0 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">
        {pending ? 'Applying…' : 'Apply'}
      </button>
      {error && (
        <p role="alert" className="text-xs text-destructive sm:self-center">
          {error}
        </p>
      )}
    </form>
  )
}

export function AdminReportActions({ reportId }: { reportId: string }) {
  const a = useAdminAction()
  return (
    <ActionForm
      name={`r-${reportId}`}
      {...a}
      options={[
        { value: 'UNDER_REVIEW', label: 'Mark under review' },
        { value: 'VERIFIED', label: 'Verify incident' },
        { value: 'DISMISSED', label: 'Dismiss' },
      ]}
      onSubmit={(fd) => a.run(`/api/v1/admin/reports/${reportId}`, { status: fd.get('action'), note: fd.get('reason') })}
    />
  )
}

export function AdminCompanyActions({ companyId }: { companyId: string }) {
  const a = useAdminAction()
  return (
    <ActionForm
      name={`c-${companyId}`}
      {...a}
      options={[
        { value: 'status:VERIFIED', label: 'Approve / restore' },
        { value: 'status:REJECTED', label: 'Reject verification' },
        { value: 'status:PENDING', label: 'Request more verification' },
        { value: 'restriction:WARNING', label: 'Warn' },
        { value: 'restriction:POSTING_RESTRICTED', label: 'Restrict posting (30d)' },
        { value: 'restriction:APPLICATIONS_FROZEN', label: 'Freeze applications (30d)' },
        { value: 'status:SUSPENDED', label: 'Suspend' },
        { value: 'restriction:NONE', label: 'Lift restriction' },
      ]}
      onSubmit={(fd) => {
        const [kind, value] = String(fd.get('action')).split(':')
        const body: Record<string, unknown> = { reason: fd.get('reason') }
        if (kind === 'status') body.status = value
        else {
          body.restriction = value
          if (value === 'POSTING_RESTRICTED' || value === 'APPLICATIONS_FROZEN') body.restrictionDays = 30
        }
        a.run(`/api/v1/admin/companies/${companyId}`, body)
      }}
    />
  )
}

export function AdminUserActions({ userId }: { userId: string }) {
  const a = useAdminAction()
  return (
    <ActionForm
      name={`u-${userId}`}
      {...a}
      options={['NORMAL', 'WARNING', 'LIMITED', 'REVIEW_REQUIRED', 'SUSPENDED'].map((s) => ({ value: s, label: s.replace('_', ' ').toLowerCase() }))}
      onSubmit={(fd) => a.run(`/api/v1/admin/users/${userId}`, { trustState: fd.get('action'), reason: fd.get('reason') })}
    />
  )
}
