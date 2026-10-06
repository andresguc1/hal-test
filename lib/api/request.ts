export function clientIp(headers: Headers): string {
  // On Vercel x-forwarded-for is set by the edge and its first hop is the client.
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return headers.get('x-real-ip') ?? 'unknown'
}

export function requestId(headers: Headers): string {
  const incoming = headers.get('x-request-id')
  return incoming && /^[a-zA-Z0-9-]{8,64}$/.test(incoming) ? incoming : crypto.randomUUID()
}
