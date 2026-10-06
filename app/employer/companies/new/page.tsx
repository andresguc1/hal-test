import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CompanyForm } from '@/components/company-form'
import { TollAIScript } from '@/components/tollai-script'
import { companiesForUser } from '@/lib/services/companies'
import { getViewer } from '@/lib/viewer'

export const metadata: Metadata = { title: 'Register your company' }

export default async function NewCompanyPage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/sign-in?next=/employer/companies/new')
  if (viewer.role !== 'EMPLOYER') redirect('/onboarding')
  if ((await companiesForUser(viewer.userId)).length > 0) redirect('/employer')

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <TollAIScript />
      <div className="flex flex-col gap-2">
        <h1 className="text-balance text-2xl font-semibold tracking-tight">Register your company</h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          ActuallyHiring is free for direct employers and always will be — capacity is earned by running hiring processes to completion, never
          bought. Agencies, staffing firms and third-party recruiters cannot register.
        </p>
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-mono">{viewer.email}</span>. Your email domain must match the company website.
        </p>
      </div>
      <CompanyForm />
    </div>
  )
}
