'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Field, FormError, SubmitButton, inputClass } from '@/components/form'
import { api, ApiClientError } from '@/lib/client/api'

export const OUTCOMES = [
  ['NONE', 'No response yet'],
  ['RESPONSE', 'Got a response'],
  ['INTERVIEW', 'Reached interview'],
  ['OFFER', 'Received an offer'],
  ['REJECTED', 'Rejected'],
  ['HIRED', 'Hired'],
] as const

type Initial = { applied: boolean; appliedOn: string | null; outcome: string } | null

export function EvidenceForm({ communityJobId, initial }: { communityJobId: string; initial: Initial }) {
  const router = useRouter()
  const [applied, setApplied] = useState(initial?.applied ?? false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setPending(true)
    setError(null)
    setSaved(false)
    try {
      await api(`/api/v1/community/jobs/${communityJobId}/evidence`, {
        body: { applied, appliedOn: applied ? (fd.get('appliedOn') as string) || null : null, outcome: applied ? fd.get('outcome') : 'NONE' },
      })
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">{initial ? 'Update your experience' : 'Add your experience'}</h2>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={applied} onChange={(e) => setApplied(e.target.checked)} className="size-4 accent-primary" />I applied to this job
      </label>
      {applied && (
        <>
          <Field id="appliedOn" label="Application date">
            <input id="appliedOn" name="appliedOn" type="date" defaultValue={initial?.appliedOn ?? ''} max={new Date().toISOString().slice(0, 10)} className={inputClass} />
          </Field>
          <Field id="outcome" label="Outcome so far">
            <select id="outcome" name="outcome" defaultValue={initial?.outcome ?? 'NONE'} className={inputClass}>
              {OUTCOMES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}
      <FormError message={error} />
      {saved && (
        <p role="status" className="text-sm text-primary">
          Saved.
        </p>
      )}
      <SubmitButton pending={pending}>{pending ? 'Saving…' : 'Save'}</SubmitButton>
    </form>
  )
}
