'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { OUTCOMES } from '@/components/evidence-form'
import { Field, FormError, SubmitButton, inputClass } from '@/components/form'
import { api, ApiClientError } from '@/lib/client/api'
import { SENIORITIES, WORK_MODES, WORK_MODE_LABELS } from '@/lib/config/platform'

type Extracted = Partial<{
  title: string
  companyName: string
  location: string
  workMode: string
  seniority: string
  salaryText: string
  technologies: string[]
  sourcePublishedAt: string
}>

export function CommunityJobForm() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [meta, setMeta] = useState<Extracted | null>(null)
  const [applied, setApplied] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  async function extract(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      const res = await api<{ metadata: Extracted }>('/api/v1/community/extract', { body: { url } })
      setMeta(res.metadata ?? {})
    } catch (err) {
      // Extraction is best-effort; the user can always fill details in manually.
      setMeta({})
      if (err instanceof ApiClientError && err.status !== 422) setError(null)
      else if (err instanceof ApiClientError) setError(err.message)
    } finally {
      setPending(false)
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const s = (k: string) => ((fd.get(k) as string) || '').trim() || null
    setPending(true)
    setError(null)
    setFieldErrors({})
    try {
      const res = await api<{ id: string }>('/api/v1/community/jobs', {
        body: {
          url,
          title: s('title') ?? '',
          companyName: s('companyName') ?? '',
          location: s('location'),
          workMode: s('workMode'),
          seniority: s('seniority'),
          salaryText: s('salaryText'),
          technologies: (s('technologies') ?? '').split(',').map((t) => t.trim()).filter(Boolean),
          sourcePublishedAt: s('sourcePublishedAt'),
          applied,
          appliedOn: applied ? s('appliedOn') : null,
          outcome: applied ? s('outcome') ?? 'NONE' : 'NONE',
        },
      })
      router.push(`/community/${res.id}`)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
        if (err.failure.fields) setFieldErrors(err.failure.fields)
      } else setError('Something went wrong.')
      setPending(false)
    }
  }

  if (!meta) {
    return (
      <form onSubmit={extract} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <Field id="url" label="Job posting URL" hint="https only. LinkedIn, company career pages, and job boards all work.">
          <input id="url" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className={inputClass} />
        </Field>
        <FormError message={error} />
        <SubmitButton pending={pending}>{pending ? 'Reading posting…' : 'Continue'}</SubmitButton>
      </form>
    )
  }

  const fe = (k: string) => fieldErrors[k]?.[0]
  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
      <p className="break-all font-mono text-xs text-muted-foreground">{url}</p>
      <p className="text-sm text-muted-foreground">
        {Object.keys(meta).length ? 'We filled in what we could read. Please correct anything that is wrong.' : 'We could not read this page. Please fill in the details.'}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="title" label="Job title" error={fe('title')}>
          <input id="title" name="title" required minLength={3} defaultValue={meta.title} className={inputClass} />
        </Field>
        <Field id="companyName" label="Company" error={fe('companyName')}>
          <input id="companyName" name="companyName" required minLength={2} defaultValue={meta.companyName} className={inputClass} />
        </Field>
        <Field id="location" label="Location">
          <input id="location" name="location" defaultValue={meta.location} className={inputClass} />
        </Field>
        <Field id="workMode" label="Work mode">
          <select id="workMode" name="workMode" defaultValue={meta.workMode ?? ''} className={inputClass}>
            <option value="">Unknown</option>
            {WORK_MODES.map((m) => (
              <option key={m} value={m}>
                {WORK_MODE_LABELS[m]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="seniority" label="Seniority">
          <select id="seniority" name="seniority" defaultValue={meta.seniority ?? ''} className={inputClass}>
            <option value="">Unknown</option>
            {SENIORITIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field id="salaryText" label="Salary as listed" hint="Leave empty if not disclosed.">
          <input id="salaryText" name="salaryText" maxLength={80} defaultValue={meta.salaryText} className={inputClass} />
        </Field>
        <Field id="technologies" label="Technologies" hint="Comma separated." className="md:col-span-2">
          <input id="technologies" name="technologies" defaultValue={meta.technologies?.join(', ')} className={inputClass} />
        </Field>
        <Field id="sourcePublishedAt" label="Posted on source (if known)">
          <input id="sourcePublishedAt" name="sourcePublishedAt" type="date" defaultValue={meta.sourcePublishedAt} className={inputClass} />
        </Field>
      </div>
      <fieldset className="flex flex-col gap-3 border-t border-border pt-4">
        <legend className="sr-only">Your application</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={applied} onChange={(e) => setApplied(e.target.checked)} className="size-4 accent-primary" />
          Did you apply?
        </label>
        {applied && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="appliedOn" label="Application date">
              <input id="appliedOn" name="appliedOn" type="date" max={new Date().toISOString().slice(0, 10)} className={inputClass} />
            </Field>
            <Field id="outcome" label="Outcome so far">
              <select id="outcome" name="outcome" defaultValue="NONE" className={inputClass}>
                {OUTCOMES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
      </fieldset>
      <FormError message={error} />
      <div className="flex gap-2">
        <button type="button" onClick={() => setMeta(null)} className="h-10 rounded-md border border-border px-4 text-sm hover:bg-secondary">
          Back
        </button>
        <SubmitButton pending={pending} className="flex-1">
          {pending ? 'Submitting…' : 'Submit job'}
        </SubmitButton>
      </div>
    </form>
  )
}
