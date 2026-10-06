import { JOB_CATEGORIES, SENIORITIES, WORK_MODES, WORK_MODE_LABELS } from '@/lib/config/platform'

type Values = { q?: string; category?: string; seniority?: string; workMode?: string; salaryOnly?: string; openOnly?: string }

const fieldClass = 'h-9 rounded-md border border-input bg-background px-2.5 text-sm focus-visible:outline-2 focus-visible:outline-ring'

/** Plain GET form: filters are shareable URLs and work without JavaScript. */
export function JobFilters({ values }: { values: Values }) {
  return (
    <form method="get" action="/" role="search" aria-label="Filter jobs" className="flex flex-col gap-3">
      <div className="flex gap-2">
        <label htmlFor="q" className="sr-only">
          Search jobs
        </label>
        <input id="q" name="q" type="search" defaultValue={values.q} placeholder="Title, company, or technology" className={`${fieldClass} flex-1`} />
        <button type="submit" className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Search
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select name="category" label="Category" value={values.category} options={JOB_CATEGORIES.map((c) => [c, c])} />
        <Select name="seniority" label="Seniority" value={values.seniority} options={SENIORITIES.map((s) => [s, s])} />
        <Select name="workMode" label="Work mode" value={values.workMode} options={WORK_MODES.map((m) => [m, WORK_MODE_LABELS[m] ?? m])} />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="salaryOnly" value="1" defaultChecked={values.salaryOnly === '1'} className="size-4 accent-primary" />
          Salary disclosed
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="openOnly" value="1" defaultChecked={values.openOnly === '1'} className="size-4 accent-primary" />
          Accepting applications
        </label>
      </div>
    </form>
  )
}

function Select({ name, label, value, options }: { name: string; label: string; value?: string; options: [string, string][] }) {
  return (
    <>
      <label htmlFor={name} className="sr-only">
        {label}
      </label>
      <select id={name} name={name} defaultValue={value ?? ''} className={fieldClass}>
        <option value="">Any {label.toLowerCase()}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </>
  )
}
