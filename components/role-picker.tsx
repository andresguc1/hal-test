'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FormError } from '@/components/form'
import { api, ApiClientError } from '@/lib/client/api'

const OPTIONS = [
  { role: 'CANDIDATE', title: "I'm looking for a job", body: 'Apply with your LinkedIn profile, track response deadlines, and report outcomes.' },
  { role: 'EMPLOYER', title: "I'm hiring for my company", body: 'Direct employers only. Recruiting agencies and third-party recruiters are not permitted.' },
] as const

export function RolePicker({ current, next }: { current: string; next: string | null }) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function choose(role: 'CANDIDATE' | 'EMPLOYER') {
    setPending(role)
    setError(null)
    try {
      await api('/api/v1/me/role', { body: { role } })
      router.push(next ?? (role === 'EMPLOYER' ? '/employer' : '/me'))
      router.refresh()
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Something went wrong.')
      setPending(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {OPTIONS.map((o) => (
        <button
          key={o.role}
          type="button"
          disabled={pending !== null}
          onClick={() => choose(o.role)}
          className="flex flex-col gap-1 rounded-md border border-border p-4 text-left hover:border-primary disabled:opacity-60 aria-pressed:border-primary"
          aria-pressed={current === o.role}
        >
          <span className="font-medium">{pending === o.role ? 'Saving…' : o.title}</span>
          <span className="text-pretty text-sm leading-relaxed text-muted-foreground">{o.body}</span>
        </button>
      ))}
      <FormError message={error} />
    </div>
  )
}
