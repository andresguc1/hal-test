'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Field, FormError, SubmitButton, inputClass, textareaClass } from '@/components/form'
import { api, ApiClientError } from '@/lib/client/api'
import { EMPLOYMENT_TYPES, JOB_CATEGORIES, PLATFORM, SENIORITIES, WORK_MODES, WORK_MODE_LABELS } from '@/lib/config/platform'

const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean)
const csv = (s: string) => s.split(',').map((l) => l.trim()).filter(Boolean)

export function JobForm({ companyId, maxApplicationsCap }: { companyId: string; maxApplicationsCap: number }) {
  const router = useRouter()
  const [pending, setPending] = useState<'draft' | 'publish' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string[]>>({})

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const intent = submitter?.value === 'publish' ? 'publish' : 'draft'
    const fd = new FormData(e.currentTarget)
    const v = (k: string) => ((fd.get(k) as string) || '').trim()
    const n = (k: string) => (v(k) ? Number(v(k)) : null)
    const salaryMin = n('salaryMin')
    setPending(intent)
    setError(null)
    setFields({})
    try {
      const { id } = await api<{ id: string }>(`/api/v1/companies/${companyId}/jobs`, {
        body: {
          title: v('title'),
          category: v('category'),
          seniority: v('seniority'),
          location: v('location'),
          workMode: v('workMode'),
          employmentType: v('employmentType'),
          salaryMin,
          salaryMax: n('salaryMax'),
          salaryCurrency: salaryMin ? v('salaryCurrency').toUpperCase() : null,
          salaryPeriod: salaryMin ? v('salaryPeriod') : null,
          description: v('description'),
          responsibilities: v('responsibilities'),
          requirements: lines(v('requirements')),
          technologies: csv(v('technologies')),
          hiringStages: lines(v('hiringStages')),
          positions: n('positions') ?? 1,
          maxApplications: n('maxApplications') ?? 100,
          responseSlaDays: n('responseSlaDays') ?? PLATFORM.defaultResponseSlaDays,
          hiringTimelineDays: n('hiringTimelineDays') ?? 30,
          applicationDeadline: v('applicationDeadline') || null,
        },
      })
      if (intent === 'publish') await api(`/api/v1/jobs/${id}/publish`, { method: 'POST' })
      router.push(`/employer/jobs/${id}`)
      router.refresh()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
        setFields(err.failure.fields ?? {})
      } else setError('Something went wrong.')
      setPending(null)
    }
  }

  const fe = (k: string) => fields[k]?.[0]
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8 rounded-lg border border-border bg-card p-6">
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-3 text-sm font-semibold">Role</legend>
        <Field id="title" label="Title" error={fe('title')} className="md:col-span-2">
          <input id="title" name="title" required minLength={3} maxLength={140} className={inputClass} />
        </Field>
        <Field id="category" label="Category">
          <select id="category" name="category" className={inputClass}>
            {JOB_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field id="seniority" label="Seniority">
          <select id="seniority" name="seniority" defaultValue="Mid" className={inputClass}>
            {SENIORITIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field id="location" label="Location" error={fe('location')}>
          <input id="location" name="location" required placeholder="Colombia, LATAM, Berlin…" className={inputClass} />
        </Field>
        <Field id="workMode" label="Work mode">
          <select id="workMode" name="workMode" className={inputClass}>
            {WORK_MODES.map((m) => (
              <option key={m} value={m}>
                {WORK_MODE_LABELS[m]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="employmentType" label="Employment type">
          <select id="employmentType" name="employmentType" className={inputClass}>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field id="positions" label="Open positions">
          <input id="positions" name="positions" type="number" min={1} max={50} defaultValue={1} className={inputClass} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-4">
        <legend className="mb-3 text-sm font-semibold">Salary</legend>
        <p className="text-xs text-muted-foreground md:col-span-4">Optional, but strongly encouraged. If left empty, candidates see “Salary not disclosed”.</p>
        <Field id="salaryMin" label="Minimum" error={fe('salaryMin')}>
          <input id="salaryMin" name="salaryMin" type="number" min={1} className={inputClass} />
        </Field>
        <Field id="salaryMax" label="Maximum" error={fe('salaryMax')}>
          <input id="salaryMax" name="salaryMax" type="number" min={1} className={inputClass} />
        </Field>
        <Field id="salaryCurrency" label="Currency" error={fe('salaryCurrency')}>
          <input id="salaryCurrency" name="salaryCurrency" defaultValue="USD" maxLength={3} className={`${inputClass} uppercase`} />
        </Field>
        <Field id="salaryPeriod" label="Per">
          <select id="salaryPeriod" name="salaryPeriod" className={inputClass}>
            <option value="MONTH">Month</option>
            <option value="YEAR">Year</option>
          </select>
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-sm font-semibold">Description</legend>
        <Field id="description" label="About the role" error={fe('description')} hint="At least 50 characters. Do not link to external application forms.">
          <textarea id="description" name="description" required minLength={50} className={`${textareaClass} min-h-32`} />
        </Field>
        <Field id="responsibilities" label="Responsibilities" error={fe('responsibilities')}>
          <textarea id="responsibilities" name="responsibilities" required minLength={20} className={textareaClass} />
        </Field>
        <Field id="requirements" label="Core requirements" hint="One per line." error={fe('requirements')}>
          <textarea id="requirements" name="requirements" required className={textareaClass} />
        </Field>
        <Field id="technologies" label="Technologies" hint="Comma separated." error={fe('technologies')}>
          <input id="technologies" name="technologies" placeholder="TypeScript, Playwright, AWS" className={inputClass} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-3 text-sm font-semibold">Process commitments</legend>
        <Field id="maxApplications" label="Maximum applications" hint={`Up to ${maxApplicationsCap} at your current capacity tier.`} error={fe('maxApplications')}>
          <input id="maxApplications" name="maxApplications" type="number" min={1} max={maxApplicationsCap} defaultValue={Math.min(100, maxApplicationsCap)} className={inputClass} />
        </Field>
        <Field id="responseSlaDays" label="Response deadline (days)" hint="You must act on every application within this window." error={fe('responseSlaDays')}>
          <input id="responseSlaDays" name="responseSlaDays" type="number" min={1} max={14} defaultValue={PLATFORM.defaultResponseSlaDays} className={inputClass} />
        </Field>
        <Field id="hiringTimelineDays" label="Expected hiring timeline (days)" error={fe('hiringTimelineDays')}>
          <input id="hiringTimelineDays" name="hiringTimelineDays" type="number" min={7} max={120} defaultValue={30} className={inputClass} />
        </Field>
        <Field id="applicationDeadline" label="Application deadline (optional)" hint={`Jobs expire after ${PLATFORM.maxJobLifetimeDays} days regardless.`}>
          <input id="applicationDeadline" name="applicationDeadline" type="date" className={inputClass} />
        </Field>
        <Field id="hiringStages" label="Hiring stages" hint="One per line, in order." error={fe('hiringStages')} className="md:col-span-2">
          <textarea id="hiringStages" name="hiringStages" required defaultValue={'Application review\nTechnical interview\nTeam interview\nOffer'} className={textareaClass} />
        </Field>
      </fieldset>

      <FormError message={error} />
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button type="submit" value="draft" disabled={pending !== null} className="h-10 rounded-md border border-border px-4 text-sm hover:bg-secondary disabled:opacity-60">
          {pending === 'draft' ? 'Saving…' : 'Save draft'}
        </button>
        <SubmitButton pending={pending !== null}>
          <span>{pending === 'publish' ? 'Publishing…' : 'Publish job'}</span>
        </SubmitButton>
      </div>
    </form>
  )
}
