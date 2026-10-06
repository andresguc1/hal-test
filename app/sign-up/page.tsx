import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AuthForm } from '@/components/auth-form'
import { AuthShell } from '@/components/auth-shell'
import { getViewer } from '@/lib/viewer'

export const metadata: Metadata = { title: 'Create account' }

export default async function SignUpPage() {
  if (await getViewer()) redirect('/')
  return (
    <AuthShell
      title="Create your account"
      lede="No CV upload, no cover letters. Candidates apply with a LinkedIn profile; employers publish for free."
    >
      <Suspense>
        <AuthForm mode="sign-up" />
      </Suspense>
    </AuthShell>
  )
}
