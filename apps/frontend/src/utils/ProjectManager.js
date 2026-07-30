import { api } from "./api";
import { logger } from "./logger";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function withRetry(fn, operationName, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLastAttempt = attempt === retries;
      logger.warn(
        `[ProjectManager] ${operationName} attempt ${attempt}/${retries} failed: ${err.message}`,
        { attempt, retries, isLastAttempt },
        "ProjectManager",
      );
      if (isLastAttempt) {
        throw err;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY_MS * attempt),
      );
    }
  }
}

class ProjectManager {
  async createProject(name, description = "", options = {}) {
    try {
      const response = await withRetry(
        () =>
          api.post("/projects", {
            name,
            description,
            ...options,
          }),
        "createProject",
      );
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
      console.log(`[ProjectManager] Fetching project: ${projectId}`);
      const response = await withRetry(
        () => api.get(`/projects/${projectId}`),
        "getProject",
      );
      return response;
    } catch (error) {
      if (error.message?.includes("status: 404")) {
        console.error(
          `[ProjectManager] Project NOT FOUND: ${projectId}`,
          error,
        );
      }
      throw error;
    }
  }

  async updateProject(projectId, updates) {
    try {
      const project = await withRetry(
        () => api.put(`/projects/${projectId}`, updates),
        "updateProject",
      );
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

  async createFlow(projectId, name, options = {}) {
    try {
      const { type, parentId, nodes, edges, canvasId } = options;
      const flow = await withRetry(
        () =>
          api.post(`/projects/${projectId}/flows`, {
            name,
            type,
            parentId,
            nodes,
            edges,
            canvasId,
          }),
        "createFlow",
      );
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
      const updatedFlow = await withRetry(
        () => api.put(`/projects/${projectId}/flows/${flowId}`, flowData),
        "updateFlow",
      );
      return updatedFlow;
    } catch (err) {
      logger.error("Failed to update flow", err, "ProjectManager");
      throw err;
    }
  }

  async deleteFlow(projectId, flowId) {
    try {
      return await api.delete(`/projects/${projectId}/flows/${flowId}`);
    } catch (err) {
      logger.error("Failed to delete flow", err, "ProjectManager");
      throw err;
    }
  }

  async saveVersion(projectId, message, _auto = false) {
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
      return await api.post("/runs/start", {
        projectId,
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
