import { ApiError } from '@/lib/api/errors'
import { apiRoute } from '@/lib/api/route'
import { extractSchema } from '@/lib/api/schemas'
import { fetchJobMetadata, UrlRejectedError } from '@/lib/domain/url'
import { log } from '@/lib/log'

/** Server-side fetch of a user URL: SSRF-guarded in fetchJobMetadata, and tightly rate limited. */
export const POST = apiRoute(
  { name: 'community.extract', auth: 'required', tollai: 'risk', blockTrustStates: 'limited', rateLimits: [{ scope: 'user', limit: 20, windowSec: 3600 }, { scope: 'ip', limit: 40, windowSec: 3600 }] },
  async ({ json, requestId }) => {
    const { url } = await json(extractSchema)
    try {
      return await fetchJobMetadata(url)
    } catch (err) {
      if (err instanceof UrlRejectedError) throw new ApiError(422, err.code, 'This link cannot be fetched. You can still enter the details manually.')
      log('warn', 'extract_failed', { requestId, error: (err as Error).message })
      throw new ApiError(422, 'EXTRACT_FAILED', 'We could not read that page. You can still enter the details manually.')
    }
  },
)
