import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthShell } from '@/components/auth-shell'
import { RolePicker } from '@/components/role-picker'
import { getViewer } from '@/lib/viewer'

export const metadata: Metadata = { title: 'Choose account type' }

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const viewer = await getViewer()
  if (!viewer) redirect('/sign-in')
  const { next } = await searchParams
  return (
    <AuthShell title="How will you use ActuallyHiring?" lede="You can only choose once. Admin access is granted separately.">
      <RolePicker current={viewer.role} next={next && next.startsWith('/') && !next.startsWith('//') ? next : null} />
    </AuthShell>
  )
}
