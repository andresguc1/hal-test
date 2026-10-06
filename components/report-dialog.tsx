'use client'

import { useState } from 'react'
import { Field, FormError, SubmitButton, textareaClass, inputClass } from '@/components/form'
import { api, ApiClientError } from '@/lib/client/api'
import { REPORT_CATEGORIES, REPORT_CATEGORY_LABELS } from '@/lib/config/platform'

export function ReportDialog({
  jobId,
  applicationId,
  communityJobId,
  ghostingEligible,
}: {
  jobId?: string | null
  applicationId?: string | null
  communityJobId?: string | null
  ghostingEligible: boolean
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const categories = REPORT_CATEGORIES.filter((c) => c !== 'JOB_GHOSTING' || ghostingEligible)

  if (done) {
    return (
      <p role="status" className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        Report received. Trust &amp; Safety reviews every report against platform records. Your identity is never shown publicly.
      </p>
    )
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="self-start text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        Report a problem with this job
      </button>
    )
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setPending(true)
    setError(null)
    try {
      await api('/api/v1/reports', {
        body: {
          category: fd.get('category'),
          description: fd.get('description'),
          jobId: jobId ?? null,
          applicationId: applicationId ?? null,
          communityJobId: communityJobId ?? null,
        },
      })
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">Report a problem</h2>
      <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
        Reports are evidence for review, not verdicts. Platform records (application dates, deadlines, last employer action) are attached
        automatically.
        {!ghostingEligible && ' Non-response reports open once the employer response deadline has passed on your application.'}
      </p>
      <Field id="category" label="Category">
        <select id="category" name="category" required className={inputClass}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {REPORT_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </Field>
      <Field id="description" label="What happened?" hint="At least 20 characters. Stick to facts.">
        <textarea id="description" name="description" required minLength={20} maxLength={2000} className={textareaClass} />
      </Field>
      <FormError message={error} />
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="h-10 flex-1 rounded-md border border-border text-sm hover:bg-secondary">
          Cancel
        </button>
        <SubmitButton pending={pending} className="flex-1">
          {pending ? 'Sending…' : 'Send report'}
        </SubmitButton>
      </div>
    </form>
  )
}
