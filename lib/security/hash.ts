import { createHmac, randomBytes } from 'node:crypto'

function key(): string {
  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret) throw new Error('BETTER_AUTH_SECRET is not configured')
  return secret
}

/** Keyed hash for IPs / UAs / tokens: stable for correlation, not reversible. */
export function keyedHash(purpose: string, value: string): string {
  return createHmac('sha256', key()).update(`${purpose}:${value}`).digest('hex').slice(0, 32)
}

export const hashIp = (ip: string) => keyedHash('ip', ip)
export const hashUa = (ua: string) => keyedHash('ua', ua)
export const hashToken = (t: string) => keyedHash('tollai-token', t)

export function randomToken(bytes = 16): string {
  return randomBytes(bytes).toString('hex')
}
