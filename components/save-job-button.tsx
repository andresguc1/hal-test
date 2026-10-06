'use client'

import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/client/api'

export function SaveJobButton({ jobId, initiallySaved }: { jobId: string; initiallySaved: boolean }) {
  const [saved, setSaved] = useState(initiallySaved)
  const [pending, setPending] = useState(false)
  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={saved}
      onClick={async () => {
        setPending(true)
        try {
          await api(`/api/v1/saved-jobs/${jobId}`, { method: saved ? 'DELETE' : 'PUT' })
          setSaved(!saved)
        } catch {
          // State stays unchanged; the button remains usable.
        } finally {
          setPending(false)
        }
      }}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border text-sm hover:bg-secondary disabled:opacity-60"
    >
      {saved ? <BookmarkCheck aria-hidden className="size-4 text-primary" /> : <Bookmark aria-hidden className="size-4" />}
      {saved ? 'Saved' : 'Save job'}
    </button>
  )
}
