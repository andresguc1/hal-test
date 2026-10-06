import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CommunityJobForm } from '@/components/community-job-form'
import { TollAIScript } from '@/components/tollai-script'
import { getViewer } from '@/lib/viewer'

export const metadata: Metadata = { title: 'Add a job you found' }

export default async function NewCommunityJobPage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/sign-in?next=/community/new')
  if (viewer.role !== 'CANDIDATE') redirect('/community')
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <TollAIScript />
      <div className="flex flex-col gap-2">
        <h1 className="text-balance text-2xl font-semibold tracking-tight">Add a job you found elsewhere</h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Paste the link and we&apos;ll try to read the posting. Check the details, then tell us whether you applied. It will be labeled as
          community-reported, never as an official company listing.
        </p>
      </div>
      <CommunityJobForm />
    </div>
  )
}
