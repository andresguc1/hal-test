import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

const tz = (name: string) => timestamp(name, { withTimezone: true })

/* ---------- Better Auth (camelCase columns by design) ---------- */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: tz('createdAt').notNull().defaultNow(),
  updatedAt: tz('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: tz('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: tz('createdAt').notNull().defaultNow(),
  updatedAt: tz('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: tz('accessTokenExpiresAt'),
  refreshTokenExpiresAt: tz('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: tz('createdAt').notNull().defaultNow(),
  updatedAt: tz('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: tz('expiresAt').notNull(),
  createdAt: tz('createdAt').notNull().defaultNow(),
  updatedAt: tz('updatedAt').notNull().defaultNow(),
})

/* ---------- Platform ---------- */

export const userProfile = pgTable('user_profile', {
  userId: text('user_id').primaryKey(),
  role: text('role').notNull().default('CANDIDATE'),
  trustState: text('trust_state').notNull().default('NORMAL'),
  linkedinUrl: text('linkedin_url'),
  portfolioUrl: text('portfolio_url'),
  githubUrl: text('github_url'),
  signupIpHash: text('signup_ip_hash'),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow(),
})

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  website: text('website').notNull(),
  domain: text('domain').notNull().unique(),
  linkedinUrl: text('linkedin_url'),
  description: text('description').notNull().default(''),
  status: text('status').notNull().default('PENDING'),
  restriction: text('restriction').notNull().default('NONE'),
  restrictionUntil: tz('restriction_until'),
  verificationToken: text('verification_token').notNull(),
  verificationCheckedAt: tz('verification_checked_at'),
  verificationEvidence: jsonb('verification_evidence')
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  createdBy: text('created_by').notNull(),
  verifiedAt: tz('verified_at'),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow(),
})

export const companyMembers = pgTable(
  'company_members',
  {
    companyId: uuid('company_id').notNull(),
    userId: text('user_id').notNull(),
    role: text('role').notNull().default('OWNER'),
    createdAt: tz('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.companyId, t.userId] })],
)

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  createdBy: text('created_by').notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  seniority: text('seniority').notNull(),
  location: text('location').notNull(),
  workMode: text('work_mode').notNull(),
  employmentType: text('employment_type').notNull(),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  salaryCurrency: text('salary_currency'),
  salaryPeriod: text('salary_period'),
  description: text('description').notNull(),
  responsibilities: text('responsibilities').notNull().default(''),
  requirements: text('requirements').array().notNull().default([]),
  technologies: text('technologies').array().notNull().default([]),
  hiringStages: text('hiring_stages').array().notNull().default([]),
  positions: integer('positions').notNull().default(1),
  maxApplications: integer('max_applications').notNull(),
  applicationCount: integer('application_count').notNull().default(0),
  responseSlaDays: integer('response_sla_days').notNull().default(7),
  hiringTimelineDays: integer('hiring_timeline_days').notNull(),
  status: text('status').notNull().default('DRAFT'),
  closeReason: text('close_reason'),
  fingerprint: text('fingerprint').notNull(),
  flags: text('flags').array().notNull().default([]),
  applicationDeadline: tz('application_deadline'),
  publishedAt: tz('published_at'),
  expiresAt: tz('expires_at'),
  version: integer('version').notNull().default(1),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow(),
})

export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull(),
  candidateId: text('candidate_id').notNull(),
  status: text('status').notNull().default('APPLIED'),
  linkedinUrl: text('linkedin_url').notNull(),
  portfolioUrl: text('portfolio_url'),
  githubUrl: text('github_url'),
  slaDeadline: tz('sla_deadline').notNull(),
  lastEmployerActionAt: tz('last_employer_action_at'),
  lastStatusMessage: text('last_status_message'),
  version: integer('version').notNull().default(1),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow(),
})

export const applicationStatusHistory = pgTable('application_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull(),
  fromStatus: text('from_status'),
  toStatus: text('to_status').notNull(),
  actorId: text('actor_id'),
  actorRole: text('actor_role').notNull(),
  message: text('message'),
  createdAt: tz('created_at').notNull().defaultNow(),
})

export const savedJobs = pgTable(
  'saved_jobs',
  {
    userId: text('user_id').notNull(),
    jobId: uuid('job_id').notNull(),
    createdAt: tz('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.jobId] })],
)

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: text('reporter_id').notNull(),
  category: text('category').notNull(),
  status: text('status').notNull().default('RECEIVED'),
  companyId: uuid('company_id'),
  jobId: uuid('job_id'),
  applicationId: uuid('application_id'),
  communityJobId: uuid('community_job_id'),
  description: text('description').notNull(),
  evidence: jsonb('evidence').$type<Record<string, unknown>>().notNull().default({}),
  weight: real('weight').notNull().default(1),
  reviewerId: text('reviewer_id'),
  reviewNote: text('review_note'),
  reviewedAt: tz('reviewed_at'),
  createdAt: tz('created_at').notNull().defaultNow(),
})

export const communityJobs = pgTable('community_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  normalizedUrl: text('normalized_url').notNull().unique(),
  source: text('source').notNull(),
  title: text('title').notNull(),
  companyName: text('company_name').notNull(),
  location: text('location'),
  workMode: text('work_mode'),
  seniority: text('seniority'),
  salaryText: text('salary_text'),
  technologies: text('technologies').array().notNull().default([]),
  status: text('status').notNull().default('EXTERNAL_UNVERIFIED'),
  submittedBy: text('submitted_by').notNull(),
  sourcePublishedAt: date('source_published_at'),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow(),
})

export const communityJobEvidence = pgTable(
  'community_job_evidence',
  {
    communityJobId: uuid('community_job_id').notNull(),
    userId: text('user_id').notNull(),
    applied: boolean('applied').notNull().default(false),
    appliedOn: date('applied_on'),
    outcome: text('outcome').notNull().default('NONE'),
    createdAt: tz('created_at').notNull().defaultNow(),
    updatedAt: tz('updated_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.communityJobId, t.userId] })],
)

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  link: text('link'),
  readAt: tz('read_at'),
  createdAt: tz('created_at').notNull().defaultNow(),
})

export const domainEvents = pgTable('domain_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  jobId: uuid('job_id'),
  companyId: uuid('company_id'),
  applicationId: uuid('application_id'),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: tz('created_at').notNull().defaultNow(),
})

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  reason: text('reason').notNull(),
  previousState: jsonb('previous_state'),
  newState: jsonb('new_state'),
  createdAt: tz('created_at').notNull().defaultNow(),
})

export const securityEvents = pgTable('security_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull(),
  path: text('path'),
  method: text('method'),
  userId: text('user_id'),
  ipHash: text('ip_hash'),
  uaHash: text('ua_hash'),
  decision: text('decision'),
  detail: jsonb('detail').$type<Record<string, unknown>>().notNull().default({}),
  requestId: text('request_id'),
  createdAt: tz('created_at').notNull().defaultNow(),
})

export const rateLimitBuckets = pgTable(
  'rate_limit_buckets',
  {
    key: text('key').notNull(),
    windowStart: tz('window_start').notNull(),
    count: integer('count').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
)

export const tollaiChallenges = pgTable('tollai_challenges', {
  challenge: text('challenge').primaryKey(),
  issuedAt: tz('issued_at').notNull().defaultNow(),
  consumedAt: tz('consumed_at'),
})

export const tollaiSessions = pgTable('tollai_sessions', {
  tokenHash: text('token_hash').primaryKey(),
  data: jsonb('data').$type<Record<string, unknown>>().notNull(),
  lastSeen: tz('last_seen').notNull().defaultNow(),
  revokedAt: tz('revoked_at'),
  createdAt: tz('created_at').notNull().defaultNow(),
})
