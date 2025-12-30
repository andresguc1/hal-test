import { api } from "./api";
import { logger } from "./logger";

class ProjectManager {
  // ========================================
  // PROJECTS
  // ========================================

  async createProject(name, description = "") {
    try {
      const project = await api.post("/projects", { name, description });
      // When creating a project in backend, we might want to also create an initial flow
      const flow = await this.createFlow(project.id, "Main Flow");
      project.flows = [flow];
      project.activeFlowId = flow.id;
      await this.updateProject(project.id, { activeFlowId: flow.id });

      logger.info(
        "Project created",
        { id: project.id, name },
        "ProjectManager",
      );
      return { ...project, flows: [flow] };
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

  async createFlow(projectId, name) {
    try {
      const flow = await api.post(`/projects/${projectId}/flows`, { name });
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
}

export const projectManager = new ProjectManager();
