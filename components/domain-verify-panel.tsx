'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api, ApiClientError } from '@/lib/client/api'

export function DomainVerifyPanel({ companyId, domain, token }: { companyId: string; domain: string; token: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const record = `actuallyhiring-verification=${token}`

  async function check() {
    setPending(true)
    setMessage(null)
    try {
      const res = await api<{ status: string; dnsVerified: boolean }>(`/api/v1/companies/${companyId}/verify`, { method: 'POST' })
      if (res.status === 'VERIFIED') router.refresh()
      else setMessage('Record not found yet. DNS changes can take a while to propagate. Trust & Safety will also review your company manually.')
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : 'Something went wrong.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
      <h2 className="font-semibold">Verify that you control {domain}</h2>
      <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
        Your corporate email already matches this domain. Add this DNS TXT record to verify instantly, or wait for a manual review. We never ask
        for registration documents.
      </p>
      <code className="block overflow-x-auto rounded-md bg-secondary px-3 py-2 font-mono text-xs">{record}</code>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={check} disabled={pending} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {pending ? 'Checking…' : 'Check DNS record'}
        </button>
        {message && (
          <p role="status" className="text-sm text-muted-foreground">
            {message}
          </p>
        )}
      </div>
    </section>
  )
}
