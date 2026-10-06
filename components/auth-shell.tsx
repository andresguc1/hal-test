export function AuthShell({ title, lede, children }: { title: string; lede: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-14">
      <div className="flex flex-col gap-2">
        <h1 className="text-balance text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{lede}</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">{children}</div>
    </div>
  )
}
