'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Field, FormError, SubmitButton, inputClass } from '@/components/form'
import { api, ApiClientError } from '@/lib/client/api'
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from '@/lib/domain/application-state'

type Props = {
  jobId: string
  accepting: boolean
  jobStatusLabel: string
  slaDays: number
  viewer: { role: string; linkedinUrl: string | null; portfolioUrl: string | null; githubUrl: string | null } | null
  existing: { status: string; slaDeadline: string } | null
}

export function ApplyPanel({ jobId, accepting, jobStatusLabel, slaDays, viewer, existing }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [step, setStep] = useState<'idle' | 'form' | 'confirm' | 'done'>('idle')
  const [values, setValues] = useState({
    linkedinUrl: viewer?.linkedinUrl ?? '',
    portfolioUrl: viewer?.portfolioUrl ?? '',
    githubUrl: viewer?.githubUrl ?? '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (existing) {
    return (
      <div className="flex flex-col gap-2 rounded-md bg-secondary p-3 text-sm">
        <p>
          You applied · <span className="font-medium">{APPLICATION_STATUS_LABELS[existing.status]}</span>
        </p>
        <p className="text-muted-foreground">
          Employer response expected by <span className="font-mono text-foreground">{new Date(existing.slaDeadline).toLocaleDateString()}</span>
        </p>
        <Link href="/me" className="text-primary hover:underline">
          View my applications
        </Link>
      </div>
    )
  }
  if (!accepting) {
    return <p className="rounded-md bg-secondary p-3 text-sm text-muted-foreground">Not accepting new applications · {jobStatusLabel}</p>
  }
  if (!viewer) {
    return (
      <Link
        href={`/sign-in?next=${encodeURIComponent(pathname)}`}
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Sign in to apply
      </Link>
    )
  }
  if (viewer.role !== 'CANDIDATE') {
    return <p className="text-sm text-muted-foreground">Only candidate accounts can apply.</p>
  }
  if (step === 'done') {
    return (
      <div role="status" className="flex flex-col gap-2 rounded-md border border-primary/40 bg-primary/10 p-3 text-sm">
        <p className="font-medium">Application submitted.</p>
        <p className="text-muted-foreground">The employer has committed to respond within {slaDays} days.</p>
      </div>
    )
  }
  if (step === 'idle') {
    return (
      <button
        type="button"
        onClick={() => setStep('form')}
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Apply
      </button>
    )
  }

  async function submit() {
    setPending(true)
    setError(null)
    setFieldErrors({})
    try {
      await api(`/api/v1/jobs/${jobId}/applications`, {
        body: { linkedinUrl: values.linkedinUrl, portfolioUrl: values.portfolioUrl || null, githubUrl: values.githubUrl || null },
      })
      setStep('done')
      router.refresh()
    } catch (e) {
      if (e instanceof ApiClientError) {
        if (e.failure.fields) {
          setFieldErrors(e.failure.fields)
          setStep('form')
        }
        setError(e.message)
      } else setError('Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  if (step === 'confirm') {
    return (
      <div className="flex flex-col gap-3 text-sm">
        <p className="font-medium">Confirm your application</p>
        <dl className="flex flex-col gap-1.5 break-all text-muted-foreground">
          <div>
            <dt className="text-xs">LinkedIn</dt>
            <dd className="text-foreground">{values.linkedinUrl}</dd>
          </div>
          {values.portfolioUrl && (
            <div>
              <dt className="text-xs">Portfolio</dt>
              <dd className="text-foreground">{values.portfolioUrl}</dd>
            </div>
          )}
          {values.githubUrl && (
            <div>
              <dt className="text-xs">GitHub</dt>
              <dd className="text-foreground">{values.githubUrl}</dd>
            </div>
          )}
        </dl>
        <p className="text-xs text-muted-foreground">The employer sees only these links and your name.</p>
        <FormError message={error} />
        <div className="flex gap-2">
          <button type="button" onClick={() => setStep('form')} className="h-10 flex-1 rounded-md border border-border hover:bg-secondary">
            Edit
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            aria-busy={pending}
            className="h-10 flex-1 rounded-md bg-primary font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {pending ? 'Submitting…' : 'Submit application'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setStep('confirm')
      }}
      className="flex flex-col gap-3"
    >
      <Field id="linkedinUrl" label="LinkedIn profile" error={fieldErrors.linkedinUrl?.[0]}>
        <input
          id="linkedinUrl"
          type="url"
          required
          placeholder="https://www.linkedin.com/in/…"
          value={values.linkedinUrl}
          onChange={(e) => setValues({ ...values, linkedinUrl: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field id="portfolioUrl" label="Portfolio (optional)" error={fieldErrors.portfolioUrl?.[0]}>
        <input id="portfolioUrl" type="url" value={values.portfolioUrl} onChange={(e) => setValues({ ...values, portfolioUrl: e.target.value })} className={inputClass} />
      </Field>
      <Field id="githubUrl" label="GitHub (optional)" error={fieldErrors.githubUrl?.[0]}>
        <input id="githubUrl" type="url" value={values.githubUrl} onChange={(e) => setValues({ ...values, githubUrl: e.target.value })} className={inputClass} />
      </Field>
      <FormError message={error && !Object.keys(fieldErrors).length ? error : null} />
      <SubmitButton pending={false}>Review</SubmitButton>
    </form>
  )
}
