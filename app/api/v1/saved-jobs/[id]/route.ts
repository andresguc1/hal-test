import { and, eq } from 'drizzle-orm'
import { Errors } from '@/lib/api/errors'
import { apiRoute } from '@/lib/api/route'
import { db } from '@/lib/db'
import { jobs, savedJobs } from '@/lib/db/schema'

const policy = { name: 'savedJobs', auth: 'required' as const, tollai: 'risk' as const, rateLimits: [{ scope: 'user' as const, limit: 120, windowSec: 3600 }] }

export const PUT = apiRoute<{ id: string }>(policy, async ({ viewer, params }) => {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) throw Errors.notFound('Job')
  const [job] = await db.select({ id: jobs.id, status: jobs.status }).from(jobs).where(eq(jobs.id, params.id)).limit(1)
  if (!job || job.status === 'DRAFT') throw Errors.notFound('Job')
  await db.insert(savedJobs).values({ userId: viewer.userId, jobId: job.id }).onConflictDoNothing()
  return { saved: true }
})

export const DELETE = apiRoute<{ id: string }>(policy, async ({ viewer, params }) => {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) throw Errors.notFound('Job')
  await db.delete(savedJobs).where(and(eq(savedJobs.userId, viewer.userId), eq(savedJobs.jobId, params.id)))
  return { saved: false }
})
