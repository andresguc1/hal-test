import { createHash } from 'node:crypto'

/* ---------- Third-party recruiting ---------- */

const THIRD_PARTY_PATTERNS: RegExp[] = [
  /\bour client\b/i,
  /\bon behalf of (?:our|a|one of our) clients?\b/i,
  /\bconfidential client\b/i,
  /\bmultiple clients\b/i,
  /\bone of our clients\b/i,
  /\brecruiting for (?:a|our) client\b/i,
  /\bstaffing agency\b/i,
  /\bnuestro cliente\b/i,
  /\ben nombre de (?:nuestro|un) cliente\b/i,
  /\bcliente confidencial\b/i,
  /\buno de nuestros clientes\b/i,
]

export function detectThirdPartyRecruiting(text: string): { flagged: boolean; matches: string[] } {
  const matches = THIRD_PARTY_PATTERNS.flatMap((re) => {
    const m = text.match(re)
    return m ? [m[0]] : []
  })
  return { flagged: matches.length > 0, matches }
}

/* ---------- External application funnels ---------- */

const ATS_DOMAINS = [
  'greenhouse.io',
  'lever.co',
  'myworkdayjobs.com',
  'workday.com',
  'ashbyhq.com',
  'smartrecruiters.com',
  'icims.com',
  'jobvite.com',
  'bamboohr.com',
  'recruitee.com',
  'breezy.hr',
  'workable.com',
  'teamtailor.com',
  'personio.de',
  'forms.gle',
  'docs.google.com',
  'typeform.com',
  'jotform.com',
  'tally.so',
  'wa.me',
  'api.whatsapp.com',
]

const DATA_COLLECTION_PHRASES: RegExp[] = [
  /\b(?:send|email|submit|upload) (?:us )?(?:your )?(?:cv|resume|résumé|curriculum)\b/i,
  /\bapply (?:at|via|through|on) (?:our|the) (?:website|portal|ats|form)\b/i,
  /\bfill (?:out|in) (?:this|the|our) form\b/i,
  /\benv[ií]a(?:nos)? tu (?:cv|hoja de vida)\b/i,
  /\bwhats?app\b/i,
]

const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"')]+/gi
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi

export type ExternalApplicationFinding = {
  kind: 'ATS_OR_FORM_URL' | 'DATA_COLLECTION_PHRASE' | 'APPLY_BY_EMAIL'
  value: string
}

/**
 * Distinguishes informational links (company site, LinkedIn, GitHub) from
 * links that move the application or candidate data off-platform.
 */
export function detectExternalApplication(
  text: string,
  companyDomain?: string,
): { flagged: boolean; findings: ExternalApplicationFinding[] } {
  const findings: ExternalApplicationFinding[] = []

  for (const raw of text.match(URL_RE) ?? []) {
    const host = safeHost(raw.startsWith('http') ? raw : `https://${raw}`)
    if (!host) continue
    if (ATS_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) {
      findings.push({ kind: 'ATS_OR_FORM_URL', value: host })
      continue
    }
    if (companyDomain && /\/(?:apply|careers?\/apply|jobs?\/\d+\/apply|application)/i.test(raw)) {
      findings.push({ kind: 'ATS_OR_FORM_URL', value: host })
    }
  }

  for (const re of DATA_COLLECTION_PHRASES) {
    const m = text.match(re)
    if (m) findings.push({ kind: 'DATA_COLLECTION_PHRASE', value: m[0] })
  }

  const emails = text.match(EMAIL_RE) ?? []
  const firstEmail = emails[0]
  if (firstEmail && /\b(?:apply|cv|resume|application|aplica)\b/i.test(text)) {
    findings.push({ kind: 'APPLY_BY_EMAIL', value: firstEmail.replace(/^[^@]+/, '***') })
  }

  return { flagged: findings.length > 0, findings }
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}

/* ---------- Duplicate / recycled job fingerprints ---------- */

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function jobFingerprint(input: {
  companyId: string
  title: string
  location: string
  employmentType: string
  requirements: string[]
  technologies: string[]
}): string {
  const canonical = [
    input.companyId,
    normalizeText(input.title),
    normalizeText(input.location),
    normalizeText(input.employmentType),
    [...input.technologies].map(normalizeText).sort().join(','),
    [...input.requirements].map(normalizeText).sort().join('|'),
  ].join('#')
  return createHash('sha256').update(canonical).digest('hex')
}

function shingles(s: string, n = 3): Set<string> {
  const words = normalizeText(s).split(' ').filter(Boolean)
  const out = new Set<string>()
  if (words.length < n) {
    if (words.length) out.add(words.join(' '))
    return out
  }
  for (let i = 0; i <= words.length - n; i++) out.add(words.slice(i, i + n).join(' '))
  return out
}

export function jaccardSimilarity(a: string, b: string): number {
  const A = shingles(a)
  const B = shingles(b)
  if (A.size === 0 && B.size === 0) return 1
  let inter = 0
  for (const x of A) if (B.has(x)) inter++
  return inter / (A.size + B.size - inter)
}

export const DUPLICATE_SIMILARITY_THRESHOLD = 0.7
