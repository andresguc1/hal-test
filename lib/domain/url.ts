import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const TRACKING_PARAMS = [
  /^utm_/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^mc_[ce]id$/i,
  /^ref$/i,
  /^refid$/i,
  /^trk/i,
  /^trackingid$/i,
  /^src$/i,
  /^source$/i,
  /^lipi$/i,
  /^ebp$/i,
  /^originalsubdomain$/i,
]

export class UrlRejectedError extends Error {
  constructor(public code: 'INVALID_URL' | 'HTTPS_REQUIRED' | 'BLOCKED_HOST' | 'PRIVATE_ADDRESS') {
    super(code)
  }
}

/** Canonical form used for deduplication of community-submitted jobs. */
export function normalizeJobUrl(input: string): { url: string; host: string } {
  let u: URL
  try {
    u = new URL(input.trim())
  } catch {
    throw new UrlRejectedError('INVALID_URL')
  }
  if (u.protocol !== 'https:') throw new UrlRejectedError('HTTPS_REQUIRED')
  if (u.username || u.password) throw new UrlRejectedError('INVALID_URL')
  if (u.port && u.port !== '443') throw new UrlRejectedError('BLOCKED_HOST')

  const host = u.hostname.toLowerCase().replace(/^www\./, '').replace(/^[a-z]{2}\.linkedin\.com$/, 'linkedin.com')
  if (isIP(host) || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || !host.includes('.'))
    throw new UrlRejectedError('BLOCKED_HOST')

  const params = [...u.searchParams.entries()]
    .filter(([k]) => !TRACKING_PARAMS.some((re) => re.test(k)))
    .sort(([a], [b]) => a.localeCompare(b))
  const search = params.length ? `?${new URLSearchParams(params).toString()}` : ''
  let path = u.pathname.replace(/\/+$/, '') || '/'
  // LinkedIn job URLs: canonicalise /jobs/view/<slug>-<id> to /jobs/view/<id>
  const li = host === 'linkedin.com' && path.match(/^\/jobs\/view\/(?:.*?-)?(\d{6,})$/)
  if (li) path = `/jobs/view/${li[1]}`
  return { url: `https://${host}${path}${li ? '' : search}`, host }
}

/* ---------- SSRF guard for server-side fetches ---------- */

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0
}

const BLOCKED_V4: Array<[string, number]> = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
]

export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const n = ipv4ToInt(ip)
    return BLOCKED_V4.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
      return (n & mask) === (ipv4ToInt(base) & mask)
    })
  }
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase()
    if (v === '::1' || v === '::') return true
    if (v.startsWith('fe80') || v.startsWith('fc') || v.startsWith('fd')) return true
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPrivateAddress(mapped[1])
    return false
  }
  return true
}

async function assertPublicHost(host: string) {
  const addrs = await lookup(host, { all: true, verbatim: true })
  if (addrs.length === 0 || addrs.some((a) => isPrivateAddress(a.address)))
    throw new UrlRejectedError('PRIVATE_ADDRESS')
}

export type ExtractedJobMetadata = {
  title?: string
  companyName?: string
  location?: string
  description?: string
  datePosted?: string
  salaryText?: string
}

/**
 * Fetches a public job page with redirects followed manually (each hop is
 * re-validated against the SSRF guard), a 5s timeout and a 1MB body cap.
 * Many job sites block server fetches; callers must treat an empty result
 * as normal and fall back to user-entered metadata.
 */
export async function fetchJobMetadata(rawUrl: string): Promise<ExtractedJobMetadata> {
  let current = normalizeJobUrl(rawUrl).url
  for (let hop = 0; hop < 4; hop++) {
    const { host } = normalizeJobUrl(current)
    await assertPublicHost(host)
    const res = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
      headers: { accept: 'text/html', 'user-agent': 'ActuallyHiringMetadataBot/1.0' },
    })
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) return {}
      current = new URL(loc, current).toString()
      continue
    }
    if (!res.ok || !res.body) return {}
    const html = await readCapped(res.body, 1_000_000)
    return parseJobHtml(html)
  }
  return {}
}

async function readCapped(body: ReadableStream<Uint8Array>, cap: number): Promise<string> {
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > cap) {
      await reader.cancel()
      break
    }
    chunks.push(value)
  }
  return new TextDecoder().decode(Buffer.concat(chunks))
}

function meta(html: string, prop: string): string | undefined {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i')
  return html.match(re)?.[1]
}

export function parseJobHtml(html: string): ExtractedJobMetadata {
  const out: ExtractedJobMetadata = {}
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1])
      const items = Array.isArray(data) ? data : data['@graph'] ?? [data]
      const posting = items.find((i: Record<string, unknown>) => i?.['@type'] === 'JobPosting')
      if (posting) {
        out.title = str(posting.title)
        out.companyName = str(posting.hiringOrganization?.name)
        out.description = str(posting.description)?.replace(/<[^>]+>/g, ' ').slice(0, 2000)
        out.datePosted = str(posting.datePosted)
        const addr = posting.jobLocation?.address ?? posting.jobLocation?.[0]?.address
        out.location = [addr?.addressLocality, addr?.addressCountry].filter(Boolean).join(', ') || undefined
        const sal = posting.baseSalary?.value
        if (sal?.minValue || sal?.value)
          out.salaryText = `${sal.minValue ?? sal.value}${sal.maxValue ? `–${sal.maxValue}` : ''} ${posting.baseSalary?.currency ?? ''}`.trim()
        break
      }
    } catch {
      /* malformed JSON-LD is common; ignore */
    }
  }
  out.title ??= meta(html, 'og:title')
  out.description ??= meta(html, 'og:description')
  return out
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, 500) : undefined
}

/** Only https URLs on the expected host may be stored as profile links. */
export function isProfileUrl(value: string, allowedHosts: string[]): boolean {
  try {
    const u = new URL(value)
    const host = u.hostname.toLowerCase().replace(/^www\./, '')
    return u.protocol === 'https:' && allowedHosts.some((h) => host === h || host.endsWith(`.${h}`))
  } catch {
    return false
  }
}
