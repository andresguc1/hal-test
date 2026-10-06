import { apiRoute } from '@/lib/api/route'
import { communityJobSchema } from '@/lib/api/schemas'
import { PLATFORM } from '@/lib/config/platform'
import { listCommunityJobs, submitCommunityJob } from '@/lib/services/community'

export const GET = apiRoute({ name: 'community.list', auth: 'none', rateLimits: [{ scope: 'ip', limit: 120, windowSec: 60 }] }, async ({ req }) => ({
  jobs: await listCommunityJobs(req.nextUrl.searchParams.get('q') ?? undefined),
}))

export const POST = apiRoute(
  {
    name: 'community.submit',
    auth: 'required',
    tollai: 'required',
    tollaiFailMode: 'closed',
    blockTrustStates: 'limited',
    rateLimits: [
      { scope: 'user', limit: PLATFORM.candidateLimits.communitySubmissionsPerDay, windowSec: 86400 },
      { scope: 'ip', limit: 30, windowSec: 86400 },
    ],
  },
  async ({ viewer, json }) => submitCommunityJob(viewer, await json(communityJobSchema)),
)
