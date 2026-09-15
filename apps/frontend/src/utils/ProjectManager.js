import { api } from "./api";
import { logger } from "./logger";
import { sanitizeForSerialization } from "./flowUtils";

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

  /**
   * Delete multiple projects atomically.
   * @param {string[]} projectIds
   * @returns {Promise<{ deleted: number, deletedIds: string[], notFoundIds: string[], stats: object }>}
   */
  async bulkDeleteProjects(projectIds) {
    try {
      const result = await api.delete(`/projects/bulk`, { projectIds });
      logger.info(
        "Projects bulk-deleted",
        { count: result?.deleted || 0 },
        "ProjectManager",
      );
      return result;
    } catch (err) {
      logger.error("Failed to bulk-delete projects", err, "ProjectManager");
      throw err;
    }
  }

  /**
   * Search + paginate projects.
   * @param {{ search?: string, page?: number, limit?: number, sort?: string, order?: string }} [params]
   */
  async searchProjects(params = {}) {
    try {
      const qs = new URLSearchParams();
      if (params.search) qs.set("search", params.search);
      if (params.page) qs.set("page", String(params.page));
      if (params.limit) qs.set("limit", String(params.limit));
      if (params.sort) qs.set("sort", params.sort);
      if (params.order) qs.set("order", params.order);
      const query = qs.toString();
      return await api.get(query ? `/projects?${query}` : "/projects");
    } catch (err) {
      logger.error("Failed to search projects", err, "ProjectManager");
      throw err;
    }
  }

  /**
   * Download the entire project as a ZIP.
   * @param {string} projectId
   * @param {boolean} [includeSecrets]
   */
  async exportProject(projectId, includeSecrets = false) {
    try {
      const query = includeSecrets ? "?sanitize=false" : "?sanitize=true";
      const blob = await api.download(`/projects/${projectId}/export${query}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hal_project_${projectId}_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return blob;
    } catch (err) {
      logger.error("Failed to export project", err, "ProjectManager");
      throw err;
    }
  }

  /**
   * Import a project from a HAL zip file.
   * @param {File|Blob} file
   * @param {{ name?: string }} [options]
   */
  async importProject(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (options.name) formData.append("name", options.name);

      const result = await api.upload(`/projects/import`, formData);
      return result;
    } catch (err) {
      logger.error("Failed to import project", err, "ProjectManager");
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
      const sanitizedData = sanitizeForSerialization(flowData);
      const updatedFlow = await withRetry(
        () => api.put(`/projects/${projectId}/flows/${flowId}`, sanitizedData),
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
