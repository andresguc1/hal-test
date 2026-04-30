import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the api module
vi.mock("./api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the logger module
vi.mock("./logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { projectManager } from "./ProjectManager";
import { api } from "./api";

beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// PROJECTS CRUD
// =============================================================================
describe("ProjectManager - Projects", () => {
  it("should create a project and return project + default flow", async () => {
    const mockResponse = {
      project: { id: "proj-1", name: "My Project" },
      flow: { id: "flow-1", name: "Default Flow" },
    };
    api.post.mockResolvedValue(mockResponse);

    const result = await projectManager.createProject(
      "My Project",
      "A description",
    );

    expect(api.post).toHaveBeenCalledWith("/projects", {
      name: "My Project",
      description: "A description",
    });
    expect(result.project.id).toBe("proj-1");
    expect(result.flow.id).toBe("flow-1");
  });

  it("should fetch a project by ID", async () => {
    api.get.mockResolvedValue({
      id: "proj-1",
      name: "Test",
      flows: [],
    });

    const result = await projectManager.getProject("proj-1");

    expect(api.get).toHaveBeenCalledWith("/projects/proj-1");
    expect(result.id).toBe("proj-1");
  });

  it("should update a project", async () => {
    api.put.mockResolvedValue({ id: "proj-1", name: "Updated" });

    const result = await projectManager.updateProject("proj-1", {
      name: "Updated",
    });

    expect(api.put).toHaveBeenCalledWith("/projects/proj-1", {
      name: "Updated",
    });
    expect(result.name).toBe("Updated");
  });

  it("should delete a project", async () => {
    api.delete.mockResolvedValue({ success: true });

    await projectManager.deleteProject("proj-1");

    expect(api.delete).toHaveBeenCalledWith("/projects/proj-1");
  });

  it("should list projects", async () => {
    api.get.mockResolvedValue([
      { id: "p1", name: "Project 1" },
      { id: "p2", name: "Project 2" },
    ]);

    const result = await projectManager.listProjects();

    expect(api.get).toHaveBeenCalledWith("/projects");
    expect(result).toHaveLength(2);
  });

  it("should return empty array when listProjects fails", async () => {
    api.get.mockRejectedValue(new Error("Network error"));

    const result = await projectManager.listProjects();

    expect(result).toEqual([]);
  });
});

// =============================================================================
// FLOWS CRUD
// =============================================================================
describe("ProjectManager - Flows", () => {
  it("should create a flow in a project", async () => {
    api.post.mockResolvedValue({ id: "flow-1", name: "Login Flow" });

    const result = await projectManager.createFlow("proj-1", "Login Flow", {
      type: "e2e",
    });

    expect(api.post).toHaveBeenCalledWith("/projects/proj-1/flows", {
      name: "Login Flow",
      type: "e2e",
      parentId: undefined,
      nodes: undefined,
      edges: undefined,
      canvasId: undefined,
    });
    expect(result.id).toBe("flow-1");
  });

  it("should get a flow by ID", async () => {
    api.get.mockResolvedValue({ id: "flow-1", nodes: [], edges: [] });

    const result = await projectManager.getFlow("proj-1", "flow-1");

    expect(api.get).toHaveBeenCalledWith("/projects/proj-1/flows/flow-1");
    expect(result.id).toBe("flow-1");
  });

  it("should update a flow", async () => {
    api.put.mockResolvedValue({ id: "flow-1", name: "Updated Flow" });

    const result = await projectManager.updateFlow("proj-1", "flow-1", {
      name: "Updated Flow",
    });

    expect(api.put).toHaveBeenCalledWith("/projects/proj-1/flows/flow-1", {
      name: "Updated Flow",
    });
    expect(result.name).toBe("Updated Flow");
  });

  it("should delete a flow", async () => {
    api.delete.mockResolvedValue({ success: true });

    await projectManager.deleteFlow("proj-1", "flow-1");

    expect(api.delete).toHaveBeenCalledWith("/projects/proj-1/flows/flow-1");
  });
});

// =============================================================================
// RUNS
// =============================================================================
describe("ProjectManager - Runs", () => {
  it("should create a run with correct payload via /runs/start", async () => {
    api.post.mockResolvedValue({ success: true, runId: "run-1" });

    const result = await projectManager.createRun("proj-1", "flow-1", {
      flowName: "Login Test",
      trigger: "manual",
      nodes: [{ id: "n1", type: "launch_browser" }],
      edges: [],
    });

    expect(api.post).toHaveBeenCalledWith("/runs/start", {
      projectId: "proj-1",
      flowId: "flow-1",
      flowName: "Login Test",
      trigger: "manual",
      nodes: [{ id: "n1", type: "launch_browser" }],
      edges: [],
    });
    expect(result.success).toBe(true);
    expect(result.runId).toBe("run-1");
  });

  it("should default trigger to 'manual' when not specified", async () => {
    api.post.mockResolvedValue({ success: true, runId: "run-2" });

    await projectManager.createRun("proj-1", "flow-1", {
      flowName: "Test",
    });

    expect(api.post).toHaveBeenCalledWith(
      "/runs/start",
      expect.objectContaining({ trigger: "manual" }),
    );
  });

  it("should propagate errors from createRun", async () => {
    api.post.mockRejectedValue(new Error("Server error"));

    await expect(projectManager.createRun("proj-1", "flow-1")).rejects.toThrow(
      "Server error",
    );
  });
});
