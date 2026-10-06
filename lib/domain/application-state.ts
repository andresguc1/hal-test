export const APPLICATION_STATUSES = [
  'APPLIED',
  'REVIEWING',
  'SHORTLISTED',
  'INTERVIEW',
  'FINALIST',
  'OFFER',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
  'APPLICATION_RESPONSE_OVERDUE',
] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const TERMINAL_APPLICATION_STATUSES: ReadonlySet<string> = new Set<ApplicationStatus>([
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
])

const EMPLOYER_FORWARD: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  APPLIED: ['REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'REJECTED'],
  REVIEWING: ['SHORTLISTED', 'INTERVIEW', 'REJECTED'],
  SHORTLISTED: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['FINALIST', 'OFFER', 'REJECTED'],
  FINALIST: ['OFFER', 'REJECTED'],
  OFFER: ['HIRED', 'REJECTED'],
  // Overdue is recoverable: the employer can still act. The overdue period
  // remains in the status history either way.
  APPLICATION_RESPONSE_OVERDUE: ['REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'FINALIST', 'OFFER', 'REJECTED'],
  HIRED: [],
  REJECTED: [],
  WITHDRAWN: [],
}

export type ApplicationActor = 'EMPLOYER' | 'CANDIDATE' | 'SYSTEM'

export function canTransitionApplication(
  from: ApplicationStatus,
  to: ApplicationStatus,
  actor: ApplicationActor,
): boolean {
  if (TERMINAL_APPLICATION_STATUSES.has(from)) return false
  switch (actor) {
    case 'CANDIDATE':
      return to === 'WITHDRAWN'
    case 'SYSTEM':
      return to === 'APPLICATION_RESPONSE_OVERDUE' && from !== 'APPLICATION_RESPONSE_OVERDUE'
    case 'EMPLOYER':
      return EMPLOYER_FORWARD[from].includes(to)
  }
}

export function allowedEmployerApplicationTransitions(from: string): readonly ApplicationStatus[] {
  return EMPLOYER_FORWARD[from as ApplicationStatus] ?? []
}

/**
 * "Overdue" is not "ghosting". Only an application that is overdue, was not
 * withdrawn, and whose job was not legitimately paused/cancelled qualifies
 * the candidate to file a JOB_GHOSTING report.
 */
export function isGhostingReportEligible(input: {
  applicationStatus: string
  slaDeadline: Date
  jobStatus: string
  now?: Date
}): { eligible: boolean; reason?: string } {
  const now = input.now ?? new Date()
  if (input.applicationStatus === 'WITHDRAWN') return { eligible: false, reason: 'APPLICATION_WITHDRAWN' }
  if (input.applicationStatus === 'REJECTED') return { eligible: false, reason: 'APPLICATION_REJECTED' }
  if (TERMINAL_APPLICATION_STATUSES.has(input.applicationStatus))
    return { eligible: false, reason: 'APPLICATION_CLOSED' }
  if (input.jobStatus === 'PAUSED') return { eligible: false, reason: 'JOB_PAUSED' }
  if (now < input.slaDeadline) return { eligible: false, reason: 'SLA_NOT_EXPIRED' }
  return { eligible: true }
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> & Record<string, string> = {
  APPLIED: 'Applied',
  REVIEWING: 'In review',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW: 'Interview',
  FINALIST: 'Finalist',
  OFFER: 'Offer',
  HIRED: 'Hired',
  REJECTED: 'Not selected',
  WITHDRAWN: 'Withdrawn',
  APPLICATION_RESPONSE_OVERDUE: 'Response overdue',
}
