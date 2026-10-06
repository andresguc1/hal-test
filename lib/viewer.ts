import 'server-only'
import { eq } from 'drizzle-orm'
import { headers as nextHeaders } from 'next/headers'
import { cache } from 'react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userProfile } from '@/lib/db/schema'

export type Role = 'CANDIDATE' | 'EMPLOYER' | 'ADMIN'
export type TrustState = 'NORMAL' | 'WARNING' | 'LIMITED' | 'REVIEW_REQUIRED' | 'SUSPENDED'

export type Viewer = {
  userId: string
  name: string
  email: string
  role: Role
  trustState: TrustState
  accountCreatedAt: Date
  linkedinUrl: string | null
  portfolioUrl: string | null
  githubUrl: string | null
}

export async function getViewerFromHeaders(h: Headers): Promise<Viewer | null> {
  const s = await auth.api.getSession({ headers: h })
  if (!s?.user) return null

  let [profile] = await db.select().from(userProfile).where(eq(userProfile.userId, s.user.id)).limit(1)
  if (!profile) {
    ;[profile] = await db
      .insert(userProfile)
      .values({ userId: s.user.id })
      .onConflictDoNothing()
      .returning()
    if (!profile) [profile] = await db.select().from(userProfile).where(eq(userProfile.userId, s.user.id)).limit(1)
  }

  return {
    userId: s.user.id,
    name: s.user.name,
    email: s.user.email,
    role: profile.role as Role,
    trustState: profile.trustState as TrustState,
    accountCreatedAt: new Date(s.user.createdAt),
    linkedinUrl: profile.linkedinUrl,
    portfolioUrl: profile.portfolioUrl,
    githubUrl: profile.githubUrl,
  }
}

/** Per-request memoised viewer for server components. */
export const getViewer = cache(async () => getViewerFromHeaders(await nextHeaders()))
