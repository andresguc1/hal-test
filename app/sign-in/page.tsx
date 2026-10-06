import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AuthForm } from '@/components/auth-form'
import { AuthShell } from '@/components/auth-shell'
import { getViewer } from '@/lib/viewer'

export const metadata: Metadata = { title: 'Sign in' }

export default async function SignInPage() {
  if (await getViewer()) redirect('/')
  return (
    <AuthShell title="Sign in" lede="Track your applications and see when employers are expected to respond.">
      <Suspense>
        <AuthForm mode="sign-in" />
      </Suspense>
    </AuthShell>
  )
}
