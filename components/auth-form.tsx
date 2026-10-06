'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Field, FormError, SubmitButton, inputClass } from '@/components/form'
import { authClient } from '@/lib/auth-client'

function safeNext(raw: string | null) {
  // Only same-origin relative paths: prevents open redirects.
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : null
}

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const params = useSearchParams()
  const next = safeNext(params.get('next'))
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email'))
    const password = String(fd.get('password'))
    const res =
      mode === 'sign-up'
        ? await authClient.signUp.email({ email, password, name: String(fd.get('name')) })
        : await authClient.signIn.email({ email, password })
    setPending(false)
    if (res.error) {
      setError(
        mode === 'sign-up'
          ? 'We could not create the account. Check your details or try signing in.'
          : 'Email or password is incorrect.',
      )
      return
    }
    router.push(mode === 'sign-up' ? `/onboarding${next ? `?next=${encodeURIComponent(next)}` : ''}` : (next ?? '/'))
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {mode === 'sign-up' && (
        <Field id="name" label="Full name">
          <input id="name" name="name" required minLength={2} maxLength={100} autoComplete="name" className={inputClass} />
        </Field>
      )}
      <Field id="email" label="Email" hint={mode === 'sign-up' ? 'Employers: use your company email to verify faster.' : undefined}>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
      </Field>
      <Field id="password" label="Password" hint={mode === 'sign-up' ? 'At least 8 characters.' : undefined}>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
          className={inputClass}
        />
      </Field>
      <FormError message={error} />
      <SubmitButton pending={pending}>{mode === 'sign-up' ? 'Create account' : 'Sign in'}</SubmitButton>
      <p className="text-sm text-muted-foreground">
        {mode === 'sign-up' ? 'Already have an account? ' : 'New here? '}
        <Link href={mode === 'sign-up' ? '/sign-in' : '/sign-up'} className="text-primary hover:underline">
          {mode === 'sign-up' ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </form>
  )
}
