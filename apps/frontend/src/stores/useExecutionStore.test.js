import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "./useExecutionStore";

const reset = () => useExecutionStore.getState().resetExecution();

describe("useExecutionStore stop/reset semantics", () => {
  beforeEach(reset);

  it("startExecution records the active run and flow", () => {
    useExecutionStore.getState().startExecution({
      mode: "calidad",
      runId: "run-123",
      flowId: "flow-abc",
      totalNodes: 5,
    });

    const s = useExecutionStore.getState();
    expect(s.status).toBe("running");
    expect(s.activeRunId).toBe("run-123");
    expect(s.flowId).toBe("flow-abc");
    expect(s.totalNodesCount).toBe(5);
  });

  it("finishExecution clears activeRunId so late frames from the dead run are ignored", () => {
    useExecutionStore.getState().startExecution({
      mode: "calidad",
      runId: "run-123",
      flowId: "flow-abc",
    });

    useExecutionStore.getState().finishExecution({
      status: "completed",
      summary: { runId: "run-123" },
    });

    const s = useExecutionStore.getState();
    expect(s.status).toBe("completed");
    expect(s.activeRunId).toBeNull();
    expect(s.lastRunSummary).toEqual({ runId: "run-123" });
  });

  it("resetExecution returns to idle and drops run/flow pointers", () => {
    useExecutionStore.getState().startExecution({
      mode: "performance",
      runId: "run-xyz",
      flowId: "flow-1",
      totalNodes: 3,
    });
    useExecutionStore.getState().updateProgress({
      percent: 40,
      executedCount: 2,
      totalCount: 3,
      currentNode: "n1",
    });

    useExecutionStore.getState().resetExecution();

    const s = useExecutionStore.getState();
    expect(s.status).toBe("idle");
    expect(s.activeRunId).toBeNull();
    expect(s.flowId).toBeNull();
    expect(s.progressPercent).toBe(0);
    expect(s.executedNodesCount).toBe(0);
    expect(s.totalNodesCount).toBe(0);
    expect(s.currentNode).toBeNull();
    expect(s.error).toBeNull();
  });

  it("a fresh run after reset gets its own activeRunId", () => {
    useExecutionStore.getState().startExecution({
      mode: "calidad",
      runId: "run-old",
      flowId: "flow-1",
    });
    useExecutionStore.getState().resetExecution();

    useExecutionStore.getState().startExecution({
      mode: "calidad",
      runId: "run-new",
      flowId: "flow-2",
    });

    const s = useExecutionStore.getState();
    expect(s.status).toBe("running");
    expect(s.activeRunId).toBe("run-new");
    expect(s.flowId).toBe("flow-2");
  });
});
