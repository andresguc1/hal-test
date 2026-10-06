import { z } from 'zod'
import { EMPLOYMENT_TYPES, JOB_CATEGORIES, REPORT_CATEGORIES, SENIORITIES, WORK_MODES } from '@/lib/config/platform'
import { APPLICATION_STATUSES } from '@/lib/domain/application-state'
import { JOB_STATUSES } from '@/lib/domain/job-state'
import { isProfileUrl } from '@/lib/domain/url'

const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => {
    try {
      return new URL(v).protocol === 'https:'
    } catch {
      return false
    }
  }, 'Must be a valid https URL')

const optionalUrl = httpsUrl.nullish().or(z.literal('').transform(() => null))

export const linkedinUrl = httpsUrl.refine((v) => isProfileUrl(v, ['linkedin.com']), 'Must be a LinkedIn profile URL (linkedin.com/in/...)')
export const githubUrl = optionalUrl.refine((v) => !v || isProfileUrl(v, ['github.com']), 'Must be a github.com URL')

const text = (min: number, max: number) => z.string().trim().min(min).max(max)
const tagList = (max: number) => z.array(text(1, 40)).max(max).transform((a) => [...new Set(a)])
const uuid = z.string().regex(/^[0-9a-f-]{36}$/i, 'Invalid id')

export const roleSchema = z.object({ role: z.enum(['CANDIDATE', 'EMPLOYER']) }).strict()

export const profileSchema = z
  .object({ linkedinUrl: linkedinUrl.nullish(), portfolioUrl: optionalUrl, githubUrl })
  .strict()

export const companySchema = z
  .object({
    name: text(2, 120),
    website: httpsUrl,
    linkedinUrl: optionalUrl,
    description: text(20, 2000),
  })
  .strict()

export const jobSchema = z
  .object({
    title: text(3, 140),
    category: z.enum(JOB_CATEGORIES),
    seniority: z.enum(SENIORITIES),
    location: text(2, 120),
    workMode: z.enum(WORK_MODES),
    employmentType: z.enum(EMPLOYMENT_TYPES),
    salaryMin: z.number().int().positive().max(10_000_000).nullish(),
    salaryMax: z.number().int().positive().max(10_000_000).nullish(),
    salaryCurrency: z.string().regex(/^[A-Z]{3}$/).nullish(),
    salaryPeriod: z.enum(['MONTH', 'YEAR']).nullish(),
    description: text(50, 6000),
    responsibilities: text(20, 4000),
    requirements: z.array(text(2, 300)).min(1).max(15),
    technologies: tagList(20),
    hiringStages: z.array(text(2, 60)).min(1).max(8),
    positions: z.number().int().min(1).max(50),
    maxApplications: z.number().int().min(1).max(500),
    responseSlaDays: z.number().int().min(1).max(14),
    hiringTimelineDays: z.number().int().min(7).max(120),
    applicationDeadline: z.string().datetime({ offset: true }).nullish().or(z.string().date().nullish()),
  })
  .strict()
  .refine((j) => j.salaryMax == null || j.salaryMin == null || j.salaryMax >= j.salaryMin, { message: 'Maximum salary must be ≥ minimum', path: ['salaryMax'] })
  .refine((j) => j.salaryMax == null || j.salaryMin != null, { message: 'Provide a minimum salary', path: ['salaryMin'] })

export const jobStatusSchema = z.object({ to: z.enum(JOB_STATUSES), reason: text(0, 500).optional() }).strict()

export const applySchema = z
  .object({ linkedinUrl, portfolioUrl: optionalUrl, githubUrl })
  .strict()

export const transitionSchema = z
  .object({ to: z.enum(APPLICATION_STATUSES), message: text(0, 1000).optional(), expectedVersion: z.number().int().positive() })
  .strict()

export const statusUpdateSchema = z.object({ message: text(1, 1000), expectedVersion: z.number().int().positive() }).strict()

export const reportSchema = z
  .object({
    category: z.enum(REPORT_CATEGORIES),
    jobId: uuid.nullish(),
    applicationId: uuid.nullish(),
    communityJobId: uuid.nullish(),
    description: text(20, 2000),
  })
  .strict()

const outcome = z.enum(['NONE', 'RESPONSE', 'INTERVIEW', 'OFFER', 'REJECTED', 'HIRED'])

export const communityJobSchema = z
  .object({
    url: httpsUrl,
    title: text(3, 140),
    companyName: text(2, 120),
    location: text(0, 120).nullish(),
    workMode: z.enum(WORK_MODES).nullish(),
    seniority: z.enum(SENIORITIES).nullish(),
    salaryText: text(0, 80).nullish(),
    technologies: tagList(15).default([]),
    sourcePublishedAt: z.string().date().nullish(),
    applied: z.boolean(),
    appliedOn: z.string().date().nullish(),
    outcome: outcome.default('NONE'),
  })
  .strict()

export const evidenceSchema = z
  .object({ applied: z.boolean(), appliedOn: z.string().date().nullish(), outcome })
  .strict()

export const extractSchema = z.object({ url: httpsUrl }).strict()

export const adminReportSchema = z.object({ status: z.enum(['UNDER_REVIEW', 'VERIFIED', 'DISMISSED']), note: text(10, 1000) }).strict()

export const adminCompanySchema = z
  .object({
    status: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED']).optional(),
    restriction: z.enum(['NONE', 'WARNING', 'POSTING_RESTRICTED', 'APPLICATIONS_FROZEN', 'SUSPENDED', 'BANNED']).optional(),
    restrictionDays: z.number().int().min(1).max(365).optional(),
    reason: text(10, 1000),
  })
  .strict()

export const adminUserSchema = z
  .object({ trustState: z.enum(['NORMAL', 'WARNING', 'LIMITED', 'REVIEW_REQUIRED', 'SUSPENDED']), reason: text(10, 1000) })
  .strict()
