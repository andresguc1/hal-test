'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api, ApiClientError } from '@/lib/client/api'

export function WithdrawButton({ applicationId }: { applicationId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function withdraw() {
    setPending(true)
    setError(null)
    try {
      await api(`/api/v1/applications/${applicationId}/withdraw`, { method: 'POST' })
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.')
      setPending(false)
    }
  }

  if (!confirming)
    return (
      <button onClick={() => setConfirming(true)} className="h-9 rounded-md border border-border px-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
        Withdraw
      </button>
    )
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span>Withdraw this application?</span>
      <button onClick={withdraw} disabled={pending} className="h-9 rounded-md bg-destructive px-3 text-destructive-foreground disabled:opacity-60">
        {pending ? 'Withdrawing…' : 'Withdraw'}
      </button>
      <button onClick={() => setConfirming(false)} className="h-9 rounded-md px-3 text-muted-foreground hover:text-foreground">
        Keep
      </button>
      {error && (
        <span role="alert" className="text-destructive">
          {error}
        </span>
      )}
    </div>
  )
}
