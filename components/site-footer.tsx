import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p className="text-pretty">A job posting is a commitment, not an advertisement. Free for direct employers. No sponsored jobs.</p>
        <nav aria-label="Footer" className="flex gap-5">
          <Link href="/market" className="hover:text-foreground">
            Hiring transparency
          </Link>
          <Link href="/community/new" className="hover:text-foreground">
            Report a job you found
          </Link>
        </nav>
      </div>
    </footer>
  )
}
