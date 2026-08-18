import { Search, X } from "lucide-react";
import { useExplorerStore } from "@/stores/useExplorerStore";
import { cn } from "@/lib/utils";

const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "main", label: "Flows" },
  { value: "component", label: "Components" },
  { value: "loop", label: "Loops" },
];

export default function SearchFilterBar() {
  const { searchQuery, setSearchQuery, filterType, setFilterType } =
    useExplorerStore();

  return (
    <div className="px-3 py-2 space-y-2 border-b border-white/5">
      <div className="relative group">
        <label htmlFor="explorer-search" className="sr-only">
          Search flows
        </label>
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"
          size={13}
          aria-hidden="true"
        />
        <input
          id="explorer-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search flows..."
          className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-1.5 pl-8 pr-7 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Clear search"
          >
            <X size={11} />
          </button>
        )}
      </div>

      <div className="flex gap-1 flex-wrap">
        {TYPE_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilterType(value)}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
              filterType === value
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "text-slate-500 hover:text-slate-300 border border-transparent hover:border-white/10",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
