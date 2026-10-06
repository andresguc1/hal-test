import { apiRoute } from '@/lib/api/route'
import { evidenceSchema } from '@/lib/api/schemas'
import { updateEvidence } from '@/lib/services/community'

export const POST = apiRoute<{ id: string }>(
  { name: 'community.evidence', auth: 'required', tollai: 'risk', blockTrustStates: 'limited', rateLimits: [{ scope: 'user', limit: 30, windowSec: 86400 }] },
  async ({ viewer, params, json }) => updateEvidence(viewer, params.id, await json(evidenceSchema)),
)
