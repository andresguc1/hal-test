export function MetricTile({ label, value, note }: { label: string; value: string | null; note: string }) {
  return (
    <div className="flex flex-col gap-1 bg-card p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      {value != null ? (
        <span className="font-mono text-2xl">{value}</span>
      ) : (
        <span className="text-sm text-muted-foreground" title="Withheld: sample below privacy threshold">
          Not enough data
        </span>
      )}
      <span className="font-mono text-xs text-muted-foreground">{note}</span>
    </div>
  )
}
