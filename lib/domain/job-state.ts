export const JOB_STATUSES = [
  'DRAFT',
  'OPEN',
  'APPLICATIONS_LIMIT_REACHED',
  'SCREENING',
  'INTERVIEWING',
  'FINALISTS',
  'OFFER',
  'HIRED',
  'REJECTED',
  'PAUSED',
  'CANCELLED',
  'EXPIRED',
] as const
export type JobStatus = (typeof JOB_STATUSES)[number]

export const TERMINAL_JOB_STATUSES: ReadonlySet<string> = new Set<JobStatus>([
  'HIRED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
])

/** Employer-initiated transitions. System-only transitions are listed separately. */
const EMPLOYER_TRANSITIONS: Record<JobStatus, readonly JobStatus[]> = {
  DRAFT: ['OPEN', 'CANCELLED'],
  OPEN: ['SCREENING', 'PAUSED', 'CANCELLED'],
  APPLICATIONS_LIMIT_REACHED: ['SCREENING', 'INTERVIEWING', 'PAUSED', 'CANCELLED'],
  SCREENING: ['INTERVIEWING', 'PAUSED', 'CANCELLED', 'REJECTED'],
  INTERVIEWING: ['FINALISTS', 'OFFER', 'PAUSED', 'CANCELLED', 'REJECTED'],
  FINALISTS: ['OFFER', 'INTERVIEWING', 'CANCELLED', 'REJECTED'],
  OFFER: ['HIRED', 'FINALISTS', 'CANCELLED'],
  // PAUSED resumes to SCREENING/INTERVIEWING only: there is no path back to
  // OPEN after screening starts, so a paused job cannot reset its intake.
  PAUSED: ['SCREENING', 'INTERVIEWING', 'CANCELLED'],
  HIRED: [],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
}

const SYSTEM_TRANSITIONS: Partial<Record<JobStatus, readonly JobStatus[]>> = {
  OPEN: ['APPLICATIONS_LIMIT_REACHED', 'EXPIRED'],
  APPLICATIONS_LIMIT_REACHED: ['EXPIRED'],
  PAUSED: ['EXPIRED'],
  DRAFT: ['EXPIRED'],
}

export function canTransitionJob(from: JobStatus, to: JobStatus, actor: 'EMPLOYER' | 'SYSTEM' | 'ADMIN'): boolean {
  if (actor === 'ADMIN') {
    return to === 'CANCELLED' ? !TERMINAL_JOB_STATUSES.has(from) : EMPLOYER_TRANSITIONS[from].includes(to)
  }
  if (actor === 'SYSTEM') return SYSTEM_TRANSITIONS[from]?.includes(to) ?? false
  return EMPLOYER_TRANSITIONS[from].includes(to)
}

export function allowedEmployerJobTransitions(from: string): readonly JobStatus[] {
  return EMPLOYER_TRANSITIONS[from as JobStatus] ?? []
}

/** Jobs counted against "active jobs" capacity. */
export const ACTIVE_JOB_STATUSES: readonly JobStatus[] = [
  'OPEN',
  'APPLICATIONS_LIMIT_REACHED',
  'SCREENING',
  'INTERVIEWING',
  'FINALISTS',
  'OFFER',
  'PAUSED',
]

export const JOB_STATUS_LABELS: Record<JobStatus, string> & Record<string, string> = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  APPLICATIONS_LIMIT_REACHED: 'Application limit reached',
  SCREENING: 'Screening',
  INTERVIEWING: 'Interviewing',
  FINALISTS: 'Finalists',
  OFFER: 'Offer stage',
  HIRED: 'Hired',
  REJECTED: 'Closed without hire',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
}
