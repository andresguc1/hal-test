'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { inputClass } from '@/components/form'
import { api, ApiClientError } from '@/lib/client/api'
import { JOB_STATUS_LABELS, type JobStatus } from '@/lib/domain/job-state'

export function JobStatusControl({ jobId, status, allowed, label }: { jobId: string; status: string; allowed: readonly JobStatus[]; label: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function move(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const to = fd.get('to') as JobStatus
    setPending(true)
    setError(null)
    try {
      if (status === 'DRAFT' && to === 'OPEN') await api(`/api/v1/jobs/${jobId}/publish`, { method: 'POST' })
      else await api(`/api/v1/jobs/${jobId}/status`, { body: { to, reason: ((fd.get('reason') as string) || '').trim() || undefined } })
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card p-4 md:w-80">
      <span className="text-xs text-muted-foreground">
        Job state: <span className="font-mono text-foreground">{label}</span>
      </span>
      {allowed.length > 0 && (
        <form onSubmit={move} className="flex flex-col gap-2">
          <label htmlFor="job-to" className="sr-only">
            Move job to
          </label>
          <select id="job-to" name="to" className={inputClass}>
            {allowed.map((s) => (
              <option key={s} value={s}>
                {s === 'OPEN' && status === 'DRAFT' ? 'Publish' : JOB_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <label htmlFor="job-reason" className="sr-only">
            Reason (shown to candidates when pausing or cancelling)
          </label>
          <input id="job-reason" name="reason" maxLength={500} placeholder="Reason (shown to candidates)" className={inputClass} />
          <button type="submit" disabled={pending} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {pending ? 'Updating…' : 'Update job'}
          </button>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
