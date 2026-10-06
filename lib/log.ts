type Level = 'info' | 'warn' | 'error'

/** Structured JSON logs. Never pass emails, URLs with PII, or tokens here. */
export function log(level: Level, msg: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({ level, msg, ts: new Date().toISOString(), ...fields })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}
