import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MAREA DESIGN SYSTEM - PROJECT SELECTOR
 * Simple, elegant project switcher using native select for reliability with glass styling.
 */

const ProjectSelector = ({
  projects,
  currentProject,
  onSelectProject,
  onCreateProject,
  // onDeleteProject,
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative group flex items-center">
      <select
        value={currentProject?.id || ""}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "NEW_PROJECT") {
            const name = prompt(t("common.new_project_name"));
            if (name) onCreateProject(name);
          } else {
            onSelectProject(val);
          }
        }}
        className={cn(
          "appearance-none pl-3 pr-8 py-1 rounded-md bg-white/5 border border-white/5 text-xs font-medium text-slate-300",
          "hover:bg-white/10 hover:border-white/10 transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-blue-500/50",
          "min-w-[120px] max-w-[200px] bg-[#0f172a]",
        )}
      >
        {projects.map((p) => (
          <option
            key={p.id}
            value={p.id}
            className="bg-slate-900 text-slate-300"
          >
            {p.name}
          </option>
        ))}
        <optgroup label="Actions">
          <option
            value="NEW_PROJECT"
            className="bg-slate-900 text-blue-400 font-bold"
          >
            + {t("common.new_project")}
          </option>
        </optgroup>
      </select>

      {/* Custom Arrow */}
      <ChevronDown
        size={12}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
      />
    </div>
  );
};

export default memo(ProjectSelector);
