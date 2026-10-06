/**
 * Platform-wide constants. Capacity is never purchasable: tiers move only on
 * observed hiring behavior (completed processes, SLA compliance, incidents).
 */
export const PLATFORM = {
  defaultResponseSlaDays: 7,
  maxJobLifetimeDays: 60,
  /** Minimum comparable records before a public metric is shown. */
  kAnonymityThreshold: 10,
  /** Minimum decided applications before company reliability metrics show. */
  reliabilityMinSample: 10,
  /** Written status updates that may extend the SLA without a stage change. */
  maxStatusUpdateExtensions: 2,
  minStatusUpdateLength: 40,
  capacityTiers: {
    NEW: { maxActiveJobs: 3, jobsPerMonth: 5, applicationsPerJobMax: 150 },
    ESTABLISHED: { maxActiveJobs: 5, jobsPerMonth: 10, applicationsPerJobMax: 250 },
    RELIABLE: { maxActiveJobs: 10, jobsPerMonth: 20, applicationsPerJobMax: 500 },
  },
  /** Completed processes + SLA compliance required to move up a tier. */
  tierPromotion: {
    ESTABLISHED: { completedProcesses: 2, slaCompliance: 0.8 },
    RELIABLE: { completedProcesses: 8, slaCompliance: 0.9 },
  },
  candidateLimits: {
    applicationsPerDay: 15,
    applicationsPerMinute: 3,
    reportsPerDay: 5,
    communitySubmissionsPerDay: 10,
  },
} as const

export const JOB_CATEGORIES = [
  'Software Engineering',
  'Frontend',
  'Backend',
  'Full Stack',
  'QA',
  'Test Automation',
  'DevOps',
  'SRE',
  'Cloud',
  'Infrastructure',
  'Cybersecurity',
  'Data Engineering',
  'Data Science',
  'AI/ML',
  'Blockchain/Web3',
  'Mobile Development',
  'Technical Product',
  'Technical Design',
  'IT',
] as const

export const SENIORITIES = ['Intern', 'Junior', 'Mid', 'Senior', 'Staff', 'Principal', 'Lead', 'Manager'] as const
export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'] as const
export const WORK_MODES = ['REMOTE', 'HYBRID', 'ONSITE'] as const

export const REPORT_CATEGORIES = [
  'JOB_GHOSTING',
  'FAKE_JOB',
  'JOB_CANCELLED_WITHOUT_NOTICE',
  'MISLEADING_JOB',
  'DUPLICATE_JOB',
  'CANDIDATE_HARVESTING',
  'THIRD_PARTY_RECRUITING',
  'EXTERNAL_APPLICATION',
  'COMPANY_IMPERSONATION',
  'SCAM_OR_FRAUD',
  'OTHER',
] as const
export type ReportCategory = (typeof REPORT_CATEGORIES)[number]

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  JOB_GHOSTING: 'No employer response within the expected period',
  FAKE_JOB: 'Job does not appear to be real',
  JOB_CANCELLED_WITHOUT_NOTICE: 'Job cancelled without notice',
  MISLEADING_JOB: 'Misleading job information',
  DUPLICATE_JOB: 'Duplicate or recycled job',
  CANDIDATE_HARVESTING: 'Collecting candidates without hiring intent',
  THIRD_PARTY_RECRUITING: 'Third-party recruiting',
  EXTERNAL_APPLICATION: 'Redirects to an external application',
  COMPANY_IMPERSONATION: 'Company impersonation',
  SCAM_OR_FRAUD: 'Scam or fraud',
  OTHER: 'Other',
}

export const WORK_MODE_LABELS: Record<string, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
}
