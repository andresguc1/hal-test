import { api } from "./api";
import { logger } from "./logger";

class ProjectManager {
  // ========================================
  // PROJECTS
  // ========================================

  async createProject(name, description = "") {
    try {
      // Backend now creates the project AND the default flow and returns { project, flow }
      const response = await api.post("/projects", { name, description });
      // Destructure to ensure we have the right shape, although api.post returns the json directly
      const { project, flow } = response;

      logger.info(
        "Project created",
        { id: project?.id, name },
        "ProjectManager",
      );

      return { project, flow };
    } catch (err) {
      logger.error("Failed to create project", err, "ProjectManager");
      throw err;
    }
  }

  async getProject(projectId) {
    try {
      const project = await api.get(`/projects/${projectId}`);
      return project;
    } catch (err) {
      logger.error("Failed to get project", err, "ProjectManager");
      return null;
    }
  }

  async updateProject(projectId, updates) {
    try {
      const project = await api.put(`/projects/${projectId}`, updates);
      return project;
    } catch (err) {
      logger.error("Failed to update project", err, "ProjectManager");
      throw err;
    }
  }

  async deleteProject(projectId) {
    try {
      await api.delete(`/projects/${projectId}`);
      logger.info("Project deleted", { projectId }, "ProjectManager");
    } catch (err) {
      logger.error("Failed to delete project", err, "ProjectManager");
      throw err;
    }
  }

  async listProjects() {
    try {
      return await api.get("/projects");
    } catch (err) {
      logger.error("Failed to list projects", err, "ProjectManager");
      return [];
    }
  }

  // ========================================
  // FLOWS
  // ========================================

  async createFlow(projectId, name, options = {}) {
    try {
      const { type, parentId, nodes, edges, canvasId } = options;
      const flow = await api.post(`/projects/${projectId}/flows`, {
        name,
        type,
        parentId,
        nodes,
        edges,
        canvasId,
      });
      return flow;
    } catch (err) {
      logger.error("Failed to create flow", err, "ProjectManager");
      throw err;
    }
  }

  async getFlow(projectId, flowId) {
    try {
      return await api.get(`/projects/${projectId}/flows/${flowId}`);
    } catch (err) {
      logger.error("Failed to get flow", err, "ProjectManager");
      return null;
    }
  }

  async updateFlow(projectId, flowId, flowData) {
    try {
      const updatedFlow = await api.put(
        `/projects/${projectId}/flows/${flowId}`,
        flowData,
      );
      return updatedFlow;
    } catch (err) {
      logger.error("Failed to update flow", err, "ProjectManager");
      throw err;
    }
  }

  async deleteFlow(projectId, flowId) {
    try {
      await api.delete(`/projects/${projectId}/flows/${flowId}`);
    } catch (err) {
      logger.error("Failed to delete flow", err, "ProjectManager");
      throw err;
    }
  }

  // ========================================
  // VERSIONING (Mocked for now in backend, or skipped)
  // ========================================

  async saveVersion(projectId, message, _auto = false) {
    // Porting versioning to SQL would require a new model.
    // For now, let's just log it.
    logger.info(
      "Version save requested (not implemented in backend yet)",
      { projectId, message },
      "ProjectManager",
    );
    return { id: "mock-version-id" };
  }

  async getVersionHistory(_projectId) {
    return [];
  }

  async restoreVersion(_projectId, _versionId) {
    throw new Error("Restore version not implemented in backend");
  }
  async createRun(projectId, flowId, options = {}) {
    try {
      const { flowName, trigger, nodes, edges } = options;
      // Backend expects { flowId, flowName, trigger, nodes, edges }
      return await api.post("/runs/start", {
        projectId, // Optional, context
        flowId,
        flowName,
        trigger: trigger || "manual",
        nodes,
        edges,
      });
    } catch (err) {
      logger.error("Failed to create run", err, "ProjectManager");
      throw err;
    }
  }
}

export const projectManager = new ProjectManager();
