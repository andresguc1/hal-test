'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Field, FormError, SubmitButton, inputClass, textareaClass } from '@/components/form'
import { api, ApiClientError } from '@/lib/client/api'

export function CompanyForm() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string[]>>({})

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const v = (k: string) => ((fd.get(k) as string) || '').trim()
    setPending(true)
    setError(null)
    setFields({})
    try {
      await api('/api/v1/companies', { body: { name: v('name'), website: v('website'), linkedinUrl: v('linkedinUrl'), description: v('description') } })
      router.push('/employer')
      router.refresh()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
        setFields(err.failure.fields ?? {})
      } else setError('Something went wrong.')
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
      <Field id="name" label="Company name" error={fields.name?.[0]}>
        <input id="name" name="name" required minLength={2} maxLength={120} className={inputClass} />
      </Field>
      <Field id="website" label="Official website" hint="Must match your email domain." error={fields.website?.[0]}>
        <input id="website" name="website" type="url" required placeholder="https://yourcompany.com" className={inputClass} />
      </Field>
      <Field id="linkedinUrl" label="Company LinkedIn (optional)" error={fields.linkedinUrl?.[0]}>
        <input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://linkedin.com/company/…" className={inputClass} />
      </Field>
      <Field id="description" label="What does your company do?" error={fields.description?.[0]}>
        <textarea id="description" name="description" required minLength={20} maxLength={2000} className={textareaClass} />
      </Field>
      <FormError message={error} />
      <SubmitButton pending={pending}>{pending ? 'Registering…' : 'Register company'}</SubmitButton>
    </form>
  )
}
