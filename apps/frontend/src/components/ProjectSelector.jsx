import React from "react";
import { useTranslation } from "react-i18next";
import { Folder, Plus, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ProjectSelector = ({
  projects,
  currentProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}) => {
  const { t, i18n } = useTranslation();

  const handleCreate = () => {
    // Ideally replace with a Dialog, but keeping prompt for now to minimize scope creep
    const name = prompt(t("common.new_project_name_prompt"));
    if (name) {
      const description = prompt(t("common.new_project_desc_prompt"));
      onCreateProject(name, description || "");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-[#2d2d2d] border-[#444] text-white hover:bg-[#3d3d3d] hover:text-white h-8 text-xs px-3 gap-2"
        >
          <Folder size={14} className="text-blue-400" />
          <span className="font-semibold max-w-[120px] truncate">
            {currentProject ? currentProject.name : t("common.select_project")}
          </span>
          <ChevronDown size={12} className="opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[240px] bg-[#252526] border-[#454545] text-gray-200"
      >
        <DropdownMenuItem
          className="bg-[#0e639c] text-white hover:bg-[#1177bb] focus:bg-[#1177bb] cursor-pointer justify-center font-medium mb-1"
          onClick={handleCreate}
        >
          <Plus size={14} className="mr-2" />
          {t("common.new_project")}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#454545]" />

        <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider">
          {t("app.projects_title", "Projects")}
        </DropdownMenuLabel>

        <div className="max-h-[300px] overflow-y-auto pr-1">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`relative flex items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-[#2a2d2e] ${currentProject?.id === project.id ? "bg-[#37373d]" : ""
                }`}
            >
              <div
                className="flex flex-1 flex-col cursor-pointer overflow-hidden"
                onClick={() => onSelectProject(project.id)}
              >
                <span className="truncate font-medium text-white">
                  {project.name}
                </span>
                <span className="text-[10px] text-gray-400">
                  {new Date(project.updatedAt).toLocaleDateString(
                    i18n.language === "es" ? "es-ES" : "en-US"
                  )}
                </span>
              </div>

              {onDeleteProject && (
                <button
                  className="ml-2 p-1 text-gray-500 hover:text-red-500 transition-colors rounded hover:bg-white/5 opacity-0 group-hover:opacity-100 focus:opacity-100" // Group hover needs parent group class
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(
                        t("common.delete_project_confirm", {
                          name: project.name,
                        })
                      )
                    ) {
                      onDeleteProject(project.id);
                    }
                  }}
                  title={t("common.delete")}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProjectSelector;
