import { cookies } from 'next/headers'
import Script from 'next/script'
import { hasLiveSession } from '@/lib/security/tollai/adapter'
import { TOLLAI_COOKIE } from '@/lib/security/tollai/instance'

/**
 * Loaded only on pages that host protected actions (apply, report, submit,
 * employer/admin dashboards). Plain browsing never pays the proof of work.
 * When the browser already holds a live session we preset the flag so the
 * client skips re-solving on every navigation.
 */
export async function TollAIScript() {
  const token = (await cookies()).get(TOLLAI_COOKIE)?.value
  const live = await hasLiveSession(token)
  return (
    <>
      {live && (
        <Script id="tollai-session-hint" strategy="beforeInteractive">
          {'window.TOLLAI_SESSION = true;'}
        </Script>
      )}
      <Script src="/vendor/tollai-client.js" strategy="afterInteractive" />
    </>
  )
}
