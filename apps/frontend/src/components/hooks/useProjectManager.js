import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectManager } from "../../utils/ProjectManager";
import { subFlowCache } from "../../utils/subFlowCache";
import { api } from "../../utils/api";
import { logger } from "../../utils/logger";

/**
 * Resolves the default flow ID for a given project.
 * Preference hierarchy:
 * 1. Last workflow or component edited or selected by the user in this project (stored in localStorage).
 * 2. The activeFlowId persisted in the project data on the backend.
 * 3. The "Main Flow" (named "Main Flow" or with type "main").
 * 4. The first flow available in the project.
 */
export const resolveDefaultFlowId = (project) => {
  if (!project?.flows || project.flows.length === 0) return null;

  // 1. Last workflow or component edited/accessed by user (persisted in localStorage)
  try {
    const savedLastFlowId = localStorage.getItem(`hal_last_flow_${project.id}`);
    if (
      savedLastFlowId &&
      project.flows.some((f) => f.id === savedLastFlowId)
    ) {
      return savedLastFlowId;
    }
  } catch (e) {
    // Ignore localStorage access errors
  }

  // 2. Project activeFlowId from backend if present
  if (
    project.activeFlowId &&
    project.flows.some((f) => f.id === project.activeFlowId)
  ) {
    return project.activeFlowId;
  }

  // 3. Main Flow (by name or type)
  const mainFlow =
    project.flows.find((f) => f.name === "Main Flow") ||
    project.flows.find((f) => f.type === "main") ||
    project.flows[0];

  return mainFlow?.id || null;
};

export function useProjectManager() {
  const queryClient = useQueryClient();
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentFlowId, setCurrentFlowId] = useState(null);

  // ========================================
  // QUERIES
  // ========================================

  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectManager.listProjects(),
    onError: (err) =>
      logger.error("Failed to load projects", err, "useProjectManager"),
  });

  const { data: currentProject = null, isLoading: isLoadingProject } = useQuery(
    {
      queryKey: ["project", currentProjectId],
      queryFn: () => projectManager.getProject(currentProjectId),
      enabled: !!currentProjectId,
    },
  );

  useEffect(() => {
    // Auto-select preferred flow (last edited flow/component or Main Flow)
    if (
      currentProject &&
      (!currentFlowId ||
        !currentProject.flows.some((f) => f.id === currentFlowId))
    ) {
      const defaultFlowId = resolveDefaultFlowId(currentProject);
      setCurrentFlowId(defaultFlowId);
    }
  }, [currentProject, currentFlowId]);

  // ========================================
  // MUTATIONS (Projects)
  // ========================================

  const createProjectMutation = useMutation({
    mutationFn: ({ name, description, options }) =>
      projectManager.createProject(name, description, options),
    onSuccess: (response) => {
      const { project, flow } = response; // Destructure new backend response

      // 1. Immediate UI Update
      queryClient.setQueryData(["project", project.id], {
        ...project,
        flows: [flow],
      }); // Inject flow into project cache
      queryClient.setQueryData(["projects"], (old) => [
        ...(old || []),
        project,
      ]);

      // 2. Auto-Select Project
      setCurrentProjectId(project.id);

      // 3. Auto-Select Default Flow
      if (flow) {
        setCurrentFlowId(flow.id);
      }

      // 4. Ensure consistency
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId) => projectManager.deleteProject(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
        setCurrentFlowId(null);
      }
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ projectId, updates }) =>
      projectManager.updateProject(projectId, updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(["project", updated.id], updated);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  // ========================================
  // MUTATIONS (Flows)
  // ========================================

  const createFlowMutation = useMutation({
    mutationFn: ({ projectId, name, options }) =>
      projectManager.createFlow(projectId, name, options),
    onSuccess: (response, { projectId }) => {
      const newFlow = response.flow || response;
      subFlowCache.invalidateAll(projectId);

      // 1. Instant UI Update with response data
      if (response && response.project) {
        queryClient.setQueryData(["project", projectId], response.project);
      }
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] }); // Sync projects list

      // 2. Auto-Select & Persist
      setCurrentFlowId(newFlow.id);
      if (newFlow?.id && projectId) {
        try {
          localStorage.setItem(`hal_last_flow_${projectId}`, newFlow.id);
        } catch (e) {}
      }
    },
  });

  const deleteFlowMutation = useMutation({
    mutationFn: ({ projectId, flowId }) =>
      projectManager.deleteFlow(projectId, flowId),
    onSuccess: (response, { projectId, flowId }) => {
      // 1. Clear or switch active flow if we just deleted it (do this BEFORE query updates to avoid race conditions)
      setCurrentFlowId((prevFlowId) => {
        if (prevFlowId === flowId) {
          const nextFlowId = response?.project?.flows?.[0]?.id || null;
          if (nextFlowId) {
            try {
              localStorage.setItem(`hal_last_flow_${projectId}`, nextFlowId);
            } catch (e) {}
          }
          return nextFlowId;
        }
        return prevFlowId;
      });

      // 2. Instant UI Update with response data
      if (response && response.project) {
        queryClient.setQueryData(["project", projectId], response.project);
      }
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] }); // Sync projects list
    },
  });

  const updateFlowMutation = useMutation({
    mutationFn: ({ projectId, flowId, updates }) =>
      projectManager.updateFlow(projectId, flowId, updates),
    onSuccess: (updatedFlow, { projectId, flowId }) => {
      subFlowCache.invalidate(projectId, flowId);
      if (projectId && flowId) {
        try {
          localStorage.setItem(`hal_last_flow_${projectId}`, flowId);
        } catch (e) {}
      }
      // 1. Instant UI Update for nested item
      if (updatedFlow) {
        queryClient.setQueryData(["project", projectId], (oldProject) => {
          if (!oldProject) return oldProject;
          const updatedFlows = (oldProject.flows || []).map((f) =>
            f.id === flowId ? { ...f, ...updatedFlow } : f,
          );
          return { ...oldProject, flows: updatedFlows };
        });
      }
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] }); // Sync projects list
    },
  });

  const reorderFlowsMutation = useMutation({
    mutationFn: ({ projectId, orders }) =>
      api.put(`/projects/${projectId}/flows/reorder`, { orders }),
    onMutate: async ({ projectId, orders }) => {
      await queryClient.cancelQueries({ queryKey: ["project", projectId] });
      const previousProject = queryClient.getQueryData(["project", projectId]);

      if (previousProject) {
        const sortedFlows = [...previousProject.flows].sort((a, b) => {
          const orderA = orders.find((o) => o.id === a.id)?.order ?? 0;
          const orderB = orders.find((o) => o.id === b.id)?.order ?? 0;
          return orderA - orderB;
        });
        queryClient.setQueryData(["project", projectId], {
          ...previousProject,
          flows: sortedFlows,
        });
      }

      return { previousProject };
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["project", updated.id], updated);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err, variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(
          ["project", variables.projectId],
          context.previousProject,
        );
      }
    },
  });

  // ========================================
  // HELPERS
  // ========================================

  const switchFlow = useCallback(
    async (flowId) => {
      if (!currentProjectId) return;
      try {
        setCurrentFlowId(flowId);
        if (flowId) {
          try {
            localStorage.setItem(`hal_last_flow_${currentProjectId}`, flowId);
          } catch (e) {}
        }
        await updateProjectMutation.mutateAsync({
          projectId: currentProjectId,
          updates: { activeFlowId: flowId },
        });
      } catch (err) {
        logger.error("Failed to switch flow", err, "useProjectManager");
      }
    },
    [currentProjectId, updateProjectMutation],
  );

  return {
    projects,
    currentProject,
    currentFlowId,
    isLoading:
      isLoadingProjects || isLoadingProject || createProjectMutation.isLoading,
    error: projectsError?.message || null,

    loadProjects: () =>
      queryClient.invalidateQueries({ queryKey: ["projects"] }),
    createProject: (name, description, options = {}) =>
      createProjectMutation.mutateAsync({ name, description, options }),
    loadProject: (projectId, preferredFlowId = null) => {
      setCurrentProjectId(projectId);
      if (projectId) {
        try {
          localStorage.setItem("hal_last_project_id", projectId);
          if (preferredFlowId) {
            localStorage.setItem(`hal_last_flow_${projectId}`, preferredFlowId);
          }
        } catch (e) {}

        let savedFlowId = preferredFlowId;
        if (!savedFlowId) {
          try {
            savedFlowId = localStorage.getItem(`hal_last_flow_${projectId}`);
          } catch (e) {}
        }
        setCurrentFlowId(savedFlowId || null);
      } else {
        setCurrentFlowId(null);
      }
    },
    deleteProject: (projectId) => deleteProjectMutation.mutateAsync(projectId),
    renameProject: (projectId, newName) =>
      updateProjectMutation.mutateAsync({
        projectId,
        updates: { name: newName },
      }),
    updateProject: (projectId, updates) =>
      updateProjectMutation.mutateAsync({
        projectId,
        updates,
      }),

    createFlow: (name, projectId, options = {}) =>
      createFlowMutation.mutateAsync({
        projectId: projectId || currentProjectId,
        name,
        options,
      }),
    switchFlow,
    deleteFlow: (flowId) =>
      deleteFlowMutation.mutateAsync({ projectId: currentProjectId, flowId }),
    renameFlow: (flowId, newName) =>
      updateFlowMutation.mutateAsync({
        projectId: currentProjectId,
        flowId,
        updates: { name: newName },
      }),
    moveFlowType: (flowId, newType) =>
      updateFlowMutation.mutateAsync({
        projectId: currentProjectId,
        flowId,
        updates: { type: newType },
      }),
    moveFlowToFolder: (flowId, parentId) =>
      updateFlowMutation.mutateAsync({
        projectId: currentProjectId,
        flowId,
        updates: { parentId: parentId || null },
      }),
    reorderFlows: (orders) =>
      reorderFlowsMutation.mutateAsync({ projectId: currentProjectId, orders }),
  };
}
