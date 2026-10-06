import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { JobForm } from '@/components/job-form'
import { TollAIScript } from '@/components/tollai-script'
import { companiesForUser, companyCapacity } from '@/lib/services/companies'
import { getViewer } from '@/lib/viewer'

export const metadata: Metadata = { title: 'New hiring process' }

export default async function NewJobPage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/sign-in?next=/employer/jobs/new')
  if (viewer.role !== 'EMPLOYER') redirect('/')
  const memberships = await companiesForUser(viewer.userId)
  const company = memberships[0]?.company
  if (!company || company.status !== 'VERIFIED' || company.restriction !== 'NONE') redirect('/employer')
  const capacity = await companyCapacity(company.id)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <TollAIScript />
      <div className="flex flex-col gap-2">
        <h1 className="text-balance text-2xl font-semibold tracking-tight">New hiring process</h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          A job posting is a commitment, not an advertisement. Candidates will see your salary range, application cap, response deadline and
          hiring timeline before they apply — and so will the public record.
        </p>
      </div>
      <JobForm companyId={company.id} maxApplicationsCap={capacity.limits.applicationsPerJobMax} />
    </div>
  )
}
