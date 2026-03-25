import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectManager } from "../../utils/ProjectManager";
import { api } from "../../utils/api";
import { logger } from "../../utils/logger";

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
      onSuccess: (project) => {
        // Auto-select first flow if none selected
        if (
          project &&
          (!currentFlowId || !project.flows.find((f) => f.id === currentFlowId))
        ) {
          if (project.flows && project.flows.length > 0) {
            setCurrentFlowId(project.flows[0].id);
          } else {
            setCurrentFlowId(null);
          }
        }
      },
      onError: (err) =>
        logger.error("Failed to load project", err, "useProjectManager"),
    },
  );

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

      // 1. Instant UI Update with response data
      if (response && response.project) {
        queryClient.setQueryData(["project", projectId], response.project);
      }
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] }); // Sync projects list

      // 2. Auto-Select
      setCurrentFlowId(newFlow.id);
    },
  });

  const deleteFlowMutation = useMutation({
    mutationFn: ({ projectId, flowId }) =>
      projectManager.deleteFlow(projectId, flowId),
    onSuccess: (response, { projectId, flowId }) => {
      // 1. Clear or switch active flow if we just deleted it (do this BEFORE query updates to avoid race conditions)
      setCurrentFlowId((prevFlowId) => {
        if (prevFlowId === flowId) {
          return response?.project?.flows?.[0]?.id || null;
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
    loadProject: (projectId) => {
      setCurrentProjectId(projectId);
      setCurrentFlowId(null); // Reset flow when switching projects
    },
    deleteProject: (projectId) => deleteProjectMutation.mutateAsync(projectId),
    renameProject: (projectId, newName) =>
      updateProjectMutation.mutateAsync({
        projectId,
        updates: { name: newName },
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
    reorderFlows: (orders) =>
      reorderFlowsMutation.mutateAsync({ projectId: currentProjectId, orders }),
  };
}
