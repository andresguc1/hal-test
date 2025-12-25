import { useState, useCallback } from "react";
import { projectManager } from "../../utils/ProjectManager";
import { logger } from "../../utils/logger";

export function useProjectManager() {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [currentFlowId, setCurrentFlowId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ========================================
  // PROJECTS
  // ========================================

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await projectManager.listProjects();
      setProjects(list);
    } catch (err) {
      logger.error("Failed to load projects", err, "useProjectManager");
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProject = useCallback(
    async (name, description) => {
      try {
        setIsLoading(true);
        const project = await projectManager.createProject(name, description);
        await loadProjects();
        return project;
      } catch (err) {
        logger.error("Failed to create project", err, "useProjectManager");
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [loadProjects],
  );

  const loadProject = useCallback(async (projectId) => {
    try {
      setIsLoading(true);
      const project = await projectManager.getProject(projectId);
      if (project) {
        setCurrentProject(project);
        // Set active flow if exists
        if (project.activeFlowId) {
          setCurrentFlowId(project.activeFlowId);
        } else if (project.flows.length > 0) {
          setCurrentFlowId(project.flows[0].id);
        } else {
          setCurrentFlowId(null);
        }
      }
      return project;
    } catch (err) {
      logger.error("Failed to load project", err, "useProjectManager");
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProject = useCallback(
    async (projectId) => {
      try {
        setIsLoading(true);
        await projectManager.deleteProject(projectId);
        if (currentProject && currentProject.id === projectId) {
          setCurrentProject(null);
          setCurrentFlowId(null);
        }
        await loadProjects();
      } catch (err) {
        logger.error("Failed to delete project", err, "useProjectManager");
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [currentProject, loadProjects],
  );

  // ========================================
  // FLOWS
  // ========================================

  const createFlow = useCallback(
    async (name) => {
      if (!currentProject) return;
      try {
        setIsLoading(true);
        const flow = await projectManager.createFlow(currentProject.id, name);
        // Reload project to get updated flows list
        await loadProject(currentProject.id);
        setCurrentFlowId(flow.id);
        return flow;
      } catch (err) {
        logger.error("Failed to create flow", err, "useProjectManager");
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentProject, loadProject],
  );

  const switchFlow = useCallback(
    async (flowId) => {
      if (!currentProject) return;
      try {
        // Verify flow exists in current project
        const flow = currentProject.flows.find((f) => f.id === flowId);
        if (flow) {
          setCurrentFlowId(flowId);
          // Update active flow in DB
          await projectManager.updateProject(currentProject.id, {
            activeFlowId: flowId,
          });
        }
      } catch (err) {
        logger.error("Failed to switch flow", err, "useProjectManager");
        setError(err.message);
      }
    },
    [currentProject],
  );

  const deleteFlow = useCallback(
    async (flowId) => {
      if (!currentProject) return;
      try {
        setIsLoading(true);
        await projectManager.deleteFlow(currentProject.id, flowId);
        await loadProject(currentProject.id);
      } catch (err) {
        logger.error("Failed to delete flow", err, "useProjectManager");
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [currentProject, loadProject],
  );

  const renameFlow = useCallback(
    async (flowId, newName) => {
      if (!currentProject) return;
      try {
        await projectManager.updateFlow(currentProject.id, flowId, {
          name: newName,
        });
        await loadProject(currentProject.id);
      } catch (err) {
        logger.error("Failed to rename flow", err, "useProjectManager");
        setError(err.message);
      }
    },
    [currentProject, loadProject],
  );

  return {
    projects,
    currentProject,
    currentFlowId,
    isLoading,
    error,

    loadProjects,
    createProject,
    loadProject,
    deleteProject,

    createFlow,
    switchFlow,
    deleteFlow,
    renameFlow,
  };
}
