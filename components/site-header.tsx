import Link from 'next/link'
import { getViewer } from '@/lib/viewer'
import { SignOutButton } from '@/components/sign-out-button'

export async function SiteHeader() {
  const viewer = await getViewer().catch(() => null)
  const dashboard =
    viewer?.role === 'ADMIN' ? { href: '/admin', label: 'Trust & Safety' } : viewer?.role === 'EMPLOYER' ? { href: '/employer', label: 'Hiring' } : viewer ? { href: '/me', label: 'My applications' } : null

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span aria-hidden className="flex size-6 items-center justify-center rounded-sm bg-primary font-mono text-xs font-bold text-primary-foreground">
              AH
            </span>
            <span>ActuallyHiring</span>
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href="/" className="hover:text-foreground">
              Jobs
            </Link>
            <Link href="/community" className="hover:text-foreground">
              Community-reported
            </Link>
            <Link href="/market" className="hover:text-foreground">
              Market
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {dashboard ? (
            <>
              <Link href={dashboard.href} className="text-foreground hover:text-primary">
                {dashboard.label}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-muted-foreground hover:text-foreground">
                Sign in
              </Link>
              <Link href="/sign-up" className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground hover:bg-primary/90">
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
      <nav aria-label="Primary mobile" className="flex gap-5 overflow-x-auto border-t border-border px-4 py-2 text-sm text-muted-foreground md:hidden">
        <Link href="/">Jobs</Link>
        <Link href="/community">Community-reported</Link>
        <Link href="/market">Market</Link>
      </nav>
    </header>
  )
}
