'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Field, FormError, SubmitButton, inputClass } from '@/components/form'
import { api, ApiClientError } from '@/lib/client/api'

type Links = { linkedinUrl: string | null; portfolioUrl: string | null; githubUrl: string | null }

export function ProfileForm({ initial }: { initial: Links }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string[]>>({})
  const [saved, setSaved] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const v = (k: string) => ((fd.get(k) as string) || '').trim()
    setPending(true)
    setError(null)
    setFields({})
    setSaved(false)
    try {
      await api('/api/v1/me/profile', {
        method: 'PATCH',
        body: { linkedinUrl: v('linkedinUrl') || null, portfolioUrl: v('portfolioUrl'), githubUrl: v('githubUrl') },
      })
      setSaved(true)
      router.refresh()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
        setFields(err.failure.fields ?? {})
      } else setError('Something went wrong.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field id="p-linkedin" label="LinkedIn" error={fields.linkedinUrl?.[0]}>
        <input id="p-linkedin" name="linkedinUrl" type="url" defaultValue={initial.linkedinUrl ?? ''} placeholder="https://linkedin.com/in/…" className={inputClass} />
      </Field>
      <Field id="p-portfolio" label="Portfolio" error={fields.portfolioUrl?.[0]}>
        <input id="p-portfolio" name="portfolioUrl" type="url" defaultValue={initial.portfolioUrl ?? ''} placeholder="https://…" className={inputClass} />
      </Field>
      <Field id="p-github" label="GitHub" error={fields.githubUrl?.[0]}>
        <input id="p-github" name="githubUrl" type="url" defaultValue={initial.githubUrl ?? ''} placeholder="https://github.com/…" className={inputClass} />
      </Field>
      <FormError message={error} />
      {saved && (
        <p role="status" className="text-sm text-primary">
          Saved.
        </p>
      )}
      <SubmitButton pending={pending}>{pending ? 'Saving…' : 'Save links'}</SubmitButton>
    </form>
  )
}
