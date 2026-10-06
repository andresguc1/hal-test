'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FormError, inputClass, textareaClass } from '@/components/form'
import { api, ApiClientError } from '@/lib/client/api'
import { relativeDays, shortDate, untilDays } from '@/lib/format'

type Applicant = {
  id: string
  status: string
  statusLabel: string
  candidateName: string
  linkedinUrl: string
  portfolioUrl: string | null
  githubUrl: string | null
  slaDeadline: string
  version: number
  createdAt: string
}

export function ApplicantRow({ application: a, transitions }: { application: Applicant; transitions: { value: string; label: string }[] }) {
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'move' | 'update'>('idle')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const closed = transitions.length === 0
  const overdue = a.status === 'APPLICATION_RESPONSE_OVERDUE'

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const message = ((fd.get('message') as string) || '').trim()
    setPending(true)
    setError(null)
    try {
      if (mode === 'move') {
        await api(`/api/v1/applications/${a.id}/transition`, { body: { to: fd.get('to'), message: message || undefined, expectedVersion: a.version } })
      } else {
        await api(`/api/v1/applications/${a.id}/update`, { body: { message, expectedVersion: a.version } })
      }
      setMode('idle')
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.')
    } finally {
      setPending(false)
    }
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-medium">{a.candidateName}</span>
          <div className="flex flex-wrap gap-3 text-sm">
            <a href={a.linkedinUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline">
              LinkedIn
            </a>
            {a.portfolioUrl && (
              <a href={a.portfolioUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline">
                Portfolio
              </a>
            )}
            {a.githubUrl && (
              <a href={a.githubUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline">
                GitHub
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded-sm border px-2 py-0.5 font-mono text-xs ${overdue ? 'border-caution/50 text-caution' : 'border-border'}`}>{a.statusLabel}</span>
          <span className="font-mono text-xs text-muted-foreground">
            applied {relativeDays(a.createdAt)}
            {!closed && ` · ${overdue ? `was due ${shortDate(a.slaDeadline)}` : `respond ${untilDays(a.slaDeadline)}`}`}
          </span>
        </div>
      </div>

      {!closed && mode === 'idle' && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setMode('move')} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Move stage
          </button>
          <button onClick={() => setMode('update')} className="h-9 rounded-md border border-border px-3 text-sm hover:bg-secondary">
            Send status update
          </button>
        </div>
      )}

      {mode !== 'idle' && (
        <form onSubmit={submit} className="flex flex-col gap-3 border-t border-border pt-3">
          {mode === 'move' && (
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">New stage</span>
              <select name="to" className={inputClass} defaultValue={transitions[0]?.value}>
                {transitions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">{mode === 'move' ? 'Message to candidate (optional)' : 'Status update for the candidate'}</span>
            <textarea
              name="message"
              required={mode === 'update'}
              minLength={mode === 'update' ? 40 : undefined}
              maxLength={1000}
              className={textareaClass}
              placeholder={mode === 'update' ? 'Explain where the process stands and when they will hear back. At least 40 characters.' : ''}
            />
          </label>
          <FormError message={error} />
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60">
              {pending ? 'Saving…' : 'Confirm'}
            </button>
            <button type="button" onClick={() => setMode('idle')} className="h-9 rounded-md px-3 text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </form>
      )}
    </li>
  )
}
