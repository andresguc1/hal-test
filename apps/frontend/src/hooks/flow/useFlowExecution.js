import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { logger } from "../../utils/logger";
import { api } from "../../utils/api";
import { useExecutionStore } from "../../stores/useExecutionStore";
import { projectManager } from "../../utils/ProjectManager";
import { subFlowCache } from "../../utils/subFlowCache";
import { useSettings } from "../../context/SettingsContext";
import {
  NODE_LABELS,
  NODE_STATES,
  getNodeStyle,
} from "../../components/hooks/flowStyles";
import * as payloadBuilders from "../../components/hooks/payloadBuilders";
import screenshotManager from "../../utils/ScreenshotManager";
import { validateNodeConfig } from "../../config/validationRules";
import { GraphValidator } from "../../utils/GraphValidator";
import { SCREENSHOT_RECOMMENDATIONS } from "../../components/hooks/constants";
import { updateNodeRecursively } from "./useFlowState";
import { getContainerFlowId } from "./utils";
import {
  resolveVariables,
  deepClone,
  matchesBranchPath,
} from "../../utils/flowUtils";
import { useCollaboration } from "../../collaboration/CollaborationProvider";

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Deterministic order for the entry nodes of an execution: the `launch_browser`
 * entry always runs FIRST (the real "start" of a flow), then remaining entries
 * in canvas order (top→bottom, left→right), with a stable id tiebreak.
 * Without this, the DB row order (arbitrary after grouping/ungrouping) decides
 * which node runs first, so execution can start from a mid-flow node — opening
 * a blank browser and running nodes out of sequence.
 */
export const orderStartNodes = (nodes) => {
  if (!Array.isArray(nodes)) return nodes;
  const isLaunch = (n) =>
    n?.type === "launch_browser" || n?.data?.type === "launch_browser";
  return [...nodes].sort((a, b) => {
    const al = isLaunch(a) ? 0 : 1;
    const bl = isLaunch(b) ? 0 : 1;
    if (al !== bl) return al - bl;
    const ap = a?.position || { x: 0, y: 0 };
    const bp = b?.position || { x: 0, y: 0 };
    if ((ap.y || 0) !== (bp.y || 0)) return (ap.y || 0) - (bp.y || 0);
    if ((ap.x || 0) !== (bp.x || 0)) return (ap.x || 0) - (bp.x || 0);
    return String(a?.id || a?.nodeId || "").localeCompare(
      String(b?.id || b?.nodeId || ""),
    );
  });
};

export const resetExecutionStatesRecursively = (list) => {
  if (!Array.isArray(list)) return list;
  return list.map((node) => {
    const newNode = deepClone(node);

    newNode.data = {
      ...(newNode.data || {}),
      state: NODE_STATES.DEFAULT,
      executed: false,
      errorDetails: null,
      error: null,
      executionTime: null,
    };
    newNode.style = getNodeStyle(NODE_STATES.DEFAULT, newNode.style);

    return newNode;
  });
};

export function useFlowExecution({
  nodes,
  edges,
  setNodes,
  setEdges,
  updateNodeState,
  currentProject,
  currentFlowId,
  addLog,
  toast,
  isCollabActive = false,
  broadcastElementState,
  clearExecutionStates,
}) {
  const collab = useCollaboration();
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState({ state: "idle", message: "" });
  const [executionStats, setExecutionStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
  });
  const [activeBrowserId, setActiveBrowserId] = useState(null);
  const [activeRunId, setActiveRunId] = useState(null);

  const { effectiveAutoHealingEnabled } = useSettings();

  const isReadOnly = useMemo(
    () => apiStatus.state === "running",
    [apiStatus.state],
  );

  const executionAbortController = useRef(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await api.get("/inspector/sessions");
        if (res.success && res.sessions?.length > 0)
          setActiveBrowserId(res.sessions[0]);
      } catch (err) {
        console.warn("Restore session failed", err);
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    return () => {
      if (executionAbortController.current) {
        executionAbortController.current.abort();
        executionAbortController.current = null;
      }
    };
  }, []);

  const stopSession = useCallback(async () => {
    if (activeRunId) {
      console.log(
        `[useFlowExecution] Stopping active execution run: ${activeRunId}`,
      );
      try {
        await api.post(`/runs/${activeRunId}/cancel`);
        if (toast) toast.success("Execution cancelled successfully");
      } catch (err) {
        console.error("Failed to cancel run:", err);
      }
    }

    if (executionAbortController.current) {
      // Abort the in-flight execution loop. Do NOT replace the controller
      // here — the loop (executeFlow) reads `current.signal.aborted` on every
      // iteration, and swapping in a fresh, non-aborted controller here would
      // make the loop see aborted===false and keep dispatching actions (opening
      // more browser windows) even though the user stopped the session. A new
      // controller is created at the start of every executeFlow() call instead.
      executionAbortController.current.abort();
    }

    if (!activeBrowserId) {
      setActiveRunId(null);
      setApiStatus({ state: "idle", message: "Execution stopped" });
      return;
    }

    try {
      setApiStatus({ state: "loading", message: "Stopping session..." });
      await api.post("/actions/close_browser", { browserId: activeBrowserId });
      setActiveBrowserId(null);
      setActiveRunId(null);
      setApiStatus({ state: "idle", message: "Session stopped" });
      if (toast) toast.success("Browser session closed");
    } catch (error) {
      console.error("Failed to stop session:", error);
      if (toast) toast.error("Failed to close browser session");
    }
  }, [activeBrowserId, activeRunId, setApiStatus, toast]);

  const resetExecutionStates = useCallback(() => {
    if (isCollabActive) {
      if (clearExecutionStates) clearExecutionStates();
    } else {
      setNodes((nds) => resetExecutionStatesRecursively(nds));
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          animated: false,
          data: { ...e.data, executionState: "default" },
        })),
      );
    }
    setExecutionStats({
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
    });
    setApiStatus({ state: "idle", message: "Node states reset" });
  }, [isCollabActive, clearExecutionStates, setNodes, setEdges]);

  const updateNodeScreenshot = useCallback(
    (nodeId, timing, screenshotData) => {
      setNodes((nds) => {
        return updateNodeRecursively(nds, nodeId, (node) => ({
          ...node,
          data: {
            ...node.data,
            screenshots: { ...node.data.screenshots, [timing]: screenshotData },
          },
        }));
      });
    },
    [setNodes],
  );

  const updateEdgeStatus = useCallback(
    (edgeId, state, animated = true) => {
      if (isCollabActive) {
        if (broadcastElementState)
          broadcastElementState(edgeId, "edge", state, { animated });
        return;
      }
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === edgeId) {
            const isError = state === NODE_STATES.ERROR;
            const isSuccess = state === NODE_STATES.SUCCESS;
            const isRunning = state === NODE_STATES.EXECUTING;

            return {
              ...edge,
              animated: animated && !isError,
              data: { ...edge.data, executionState: state },
              style: {
                ...edge.style,
                stroke: isError
                  ? "#ef4444"
                  : isSuccess
                    ? "#22c55e"
                    : isRunning
                      ? "#ff8c32"
                      : "#64748b",
                strokeWidth: isRunning || isSuccess || isError ? 3 : 2,
                opacity: isRunning || isSuccess || isError ? 1 : 0.6,
              },
            };
          }
          return edge;
        }),
      );
    },
    [isCollabActive, broadcastElementState, setEdges],
  );

  const updateEdgeStatusBySource = useCallback(
    (sourceId, state, animated = true) => {
      if (isCollabActive) {
        if (broadcastElementState)
          broadcastElementState(sourceId, "edge_by_source", state, {
            animated,
          });
        return;
      }
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.source === sourceId) {
            const isError = state === NODE_STATES.ERROR;
            const isSuccess = state === NODE_STATES.SUCCESS;
            const isRunning = state === NODE_STATES.EXECUTING;

            return {
              ...edge,
              animated: animated && !isError,
              data: { ...edge.data, executionState: state },
              style: {
                ...edge.style,
                stroke: isError
                  ? "#ef4444"
                  : isSuccess
                    ? "#22c55e"
                    : isRunning
                      ? "#ff8c32"
                      : "#64748b",
                strokeWidth: isRunning || isSuccess || isError ? 3 : 2,
                opacity: isRunning || isSuccess || isError ? 1 : 0.6,
              },
            };
          }
          return edge;
        }),
      );
    },
    [isCollabActive, broadcastElementState, setEdges],
  );

  const captureScreenshot = useCallback(
    async ({ nodeId, timing, browserId, nodeType }) => {
      try {
        const recommendation = SCREENSHOT_RECOMMENDATIONS[nodeType];
        const delay = recommendation?.delay?.[timing] || 0;
        if (delay > 0) await sleep(delay);

        const data = await api.post("/actions/take_screenshot", {
          browserId,
          selector: null,
          path: null,
          fullPage: false,
          format: "jpeg",
          quality: 80,
          timeout: 30000,
        });

        let base64Screenshot =
          data.data?.screenshot ||
          data.screenshot ||
          data.image ||
          (typeof data.data === "string" ? data.data : null);
        if (!base64Screenshot || typeof base64Screenshot !== "string")
          throw new Error("Invalid screenshot data");

        await screenshotManager.deleteScreenshot(nodeId, timing);
        const metadata = await screenshotManager.saveScreenshot(
          nodeId,
          timing,
          base64Screenshot,
        );
        updateNodeScreenshot(nodeId, timing, metadata);
        return metadata;
      } catch (error) {
        logger.error("Screenshot capture failed", error);
        return null;
      }
    },
    [updateNodeScreenshot],
  );

  const executeStep = useCallback(
    async (nodeOrAction, _type, _payload = {}, _options = {}) => {
      let action = nodeOrAction;
      if (typeof nodeOrAction === "string") {
        action = { nodeId: nodeOrAction, type: _type, payload: _payload };
      } else if (nodeOrAction?.id) {
        action = {
          nodeId: nodeOrAction.id,
          type: nodeOrAction.type,
          payload: {
            ...(nodeOrAction.data?.configuration || {}),
            customLabel: nodeOrAction.data?.customLabel,
            label: nodeOrAction.data?.label || nodeOrAction.label,
          },
          ...nodeOrAction,
        };
      }

      if (!action?.nodeId) return { success: false, error: "Invalid action" };

      const { nodeId, payload } = action;
      const type = action.data?.type || action.type || "unknown";
      const endpoint = payload?.endpoint || `/actions/${type}`;
      const browserId = payload?.browserId || activeBrowserId;

      updateNodeState(nodeId, NODE_STATES.EXECUTING);
      setIsLoading(true);
      setApiStatus({
        state: "loading",
        message: `Executing ${NODE_LABELS[type] || type}...`,
      });

      const startTime = Date.now();
      const maxActionAttempts = effectiveAutoHealingEnabled ? MAX_RETRIES : 1;
      for (let attempt = 0; attempt < maxActionAttempts; attempt++) {
        if (executionAbortController.current?.signal.aborted) {
          updateNodeState(nodeId, NODE_STATES.SKIPPED);
          setIsLoading(false);
          return { success: false, skipped: true, error: "Cancelled" };
        }

        try {
          const builder = payloadBuilders[type];
          const bodyToSend = builder ? builder(payload || {}) : payload || {};
          bodyToSend.nodeId = nodeId;
          if (payload?.customLabel)
            bodyToSend.customLabel = payload.customLabel;
          if (payload?.label) bodyToSend.label = payload.label;
          if (activeBrowserId && !bodyToSend.browserId)
            bodyToSend.browserId = activeBrowserId;
          if (type !== "close_browser") bodyToSend.debugMode = true;

          const effectiveRunId = payload?.runId || activeRunId || "atomic_run";
          if (effectiveRunId?.length >= 5) bodyToSend.runId = effectiveRunId;
          if (_options?.variables || payload?.variables) {
            bodyToSend.variables = {
              ...(_options?.variables || {}),
              ...(payload?.variables || {}),
            };
          }

          const result = await api.post(endpoint, bodyToSend, {
            signal: executionAbortController.current?.signal,
          });
          const duration = Date.now() - startTime;
          const instanceId = result.data?.browserId ?? result.browserId ?? null;

          if (instanceId && !activeBrowserId) {
            setActiveBrowserId(instanceId);
            localStorage.setItem("lastBrowserId", instanceId);
          }

          setNodes((nds) => {
            return updateNodeRecursively(nds, nodeId, (node) => {
              const isHealed = result?.healed === true;
              const isSoftFail =
                result?.status === "softfailed" ||
                result?.data?.status === "softfailed";
              const finalState = isHealed
                ? NODE_STATES.HEALED
                : isSoftFail
                  ? NODE_STATES.SOFTFAILED
                  : NODE_STATES.SUCCESS;
              return {
                ...node,
                data: {
                  ...node.data,
                  executed: true,
                  state: finalState,
                  result,
                  executionTime: duration,
                },
                style: getNodeStyle(finalState, node.style),
              };
            });
          });

          setApiStatus({
            state: "success",
            message: `✓ Success in ${duration}ms`,
          });

          const explicitScreenshot =
            result?.data?.screenshot || result?.screenshot;
          if (explicitScreenshot && typeof explicitScreenshot === "string") {
            const isServerPath =
              explicitScreenshot.startsWith("storage/") ||
              explicitScreenshot.startsWith("http");
            const finalScreenshot =
              !isServerPath &&
              !explicitScreenshot.startsWith("data:") &&
              !explicitScreenshot.startsWith("blob:")
                ? `data:image/jpeg;base64,${explicitScreenshot}`
                : explicitScreenshot;

            if (isServerPath) {
              updateNodeScreenshot(nodeId, "after", {
                url: finalScreenshot,
                path: finalScreenshot,
                timestamp: Date.now(),
              });
            } else {
              const metadata = await screenshotManager.saveScreenshot(
                nodeId,
                "after",
                finalScreenshot,
              );
              updateNodeScreenshot(nodeId, "after", metadata);
            }
          } else if (bodyToSend.takeScreenshot && browserId) {
            updateNodeState(nodeId, NODE_STATES.CAPTURING_AFTER);
            await captureScreenshot({
              nodeId,
              timing: "after",
              browserId,
              nodeType: type,
            });
            updateNodeState(nodeId, NODE_STATES.SUCCESS);
          }

          setIsLoading(false);
          return { success: true, result, duration, instanceId };
        } catch (error) {
          // A "browser has been closed/disconnected" failure usually means the
          // tracked session (activeBrowserId) is stale. Invalidate it so later
          // nodes stop targeting the dead session and the engine re-resolves.
          if (
            /closed|disconnected|cerrado|desconectado/i.test(error.message || "")
          ) {
            setActiveBrowserId(null);
          }
          if (error.name !== "AbortError" && attempt < maxActionAttempts - 1) {
            await sleep(RETRY_BASE_MS * 2 ** attempt);
            continue;
          }
          updateNodeState(nodeId, NODE_STATES.ERROR, {
            message: error.message,
          });
          setApiStatus({
            state: "error",
            message: `✗ Failure: ${error.message}`,
          });
          addLog(`[NodeError] ${nodeId}: ${error.message}`, "error", nodeId);
          setIsLoading(false);
          return { success: false, error: error.message };
        }
      }
    },
    [
      updateNodeState,
      activeBrowserId,
      activeRunId,
      setNodes,
      updateNodeScreenshot,
      captureScreenshot,
      addLog,
      effectiveAutoHealingEnabled,
    ],
  );

  const validateFlowStructure = useCallback(
    (nodesToValidate, edgesToValidate) => {
      const errors = [];
      const executionNodes = nodesToValidate.filter(
        (n) =>
          !["guide", "note", "comment"].includes(n.type) && !n.data?.disabled,
      );

      if (executionNodes.length === 0) return ["Flow is empty"];

      // Filter out edges that reference non-existent or disabled nodes
      const activeNodeIds = new Set(executionNodes.map((n) => n.id));
      const filteredEdges = (edgesToValidate || []).filter(
        (e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target),
      );

      // Find root/starting nodes (nodes with 0 incoming active edges)
      const targets = new Set(filteredEdges.map((e) => e.target));
      const roots = executionNodes.filter((n) => !targets.has(n.id));

      let activeRoots = [];
      if (roots.length === 0) {
        errors.push("No starting point found");
      } else {
        // Find which roots can reach the 'launch_browser' node
        const reachLaunch = roots.filter((r) => {
          const visited = new Set();
          const queue = [r.id];
          while (queue.length > 0) {
            const curr = queue.shift();
            if (visited.has(curr)) continue;
            visited.add(curr);
            const node = executionNodes.find((n) => n.id === curr);
            if (
              node &&
              (node.type === "launch_browser" ||
                node.data?.type === "launch_browser")
            ) {
              return true;
            }
            const outgoing = filteredEdges
              .filter((e) => e.source === curr)
              .map((e) => e.target);
            queue.push(...outgoing);
          }
          return false;
        });

        if (reachLaunch.length > 0) {
          // All roots that can reach 'launch_browser' are valid starting points (e.g. parallel variable nodes)
          activeRoots = reachLaunch;
        } else {
          // Fallback: search for launch_browser itself among the roots
          const launchRoots = roots.filter(
            (r) =>
              r.type === "launch_browser" || r.data?.type === "launch_browser",
          );
          if (launchRoots.length > 0) {
            activeRoots = launchRoots;
          } else {
            errors.push("No starting point found");
          }
        }
      }

      // ─── ACTIVE PATH BFS EXTRACTION ───
      const reachableNodeIds = new Set();
      if (activeRoots.length > 0) {
        const queue = activeRoots.map((r) => r.id);
        while (queue.length > 0) {
          const currId = queue.shift();
          if (!reachableNodeIds.has(currId)) {
            reachableNodeIds.add(currId);
            const outgoing = filteredEdges.filter((e) => e.source === currId);
            for (const edge of outgoing) {
              if (!reachableNodeIds.has(edge.target)) {
                queue.push(edge.target);
              }
            }
          }
        }
      }

      // Validate configurations ONLY for nodes that are part of the active execution path
      for (const n of executionNodes) {
        if (!reachableNodeIds.has(n.id)) {
          // Skip validation for unreachable/draft/orphan nodes!
          continue;
        }

        const type = n.data?.subType || n.data?.type || n.type;
        const validation = validateNodeConfig(
          type,
          n.data?.configuration || {},
        );
        if (!validation.isValid)
          errors.push(
            `Node "${n.data?.label || type}" is missing field: ${validation.missingField}`,
          );
      }

      // Validate structure only using reachable nodes and edges
      try {
        const reachableNodes = executionNodes.filter((n) =>
          reachableNodeIds.has(n.id),
        );
        const reachableEdges = filteredEdges.filter(
          (e) =>
            reachableNodeIds.has(e.source) && reachableNodeIds.has(e.target),
        );

        const result = GraphValidator.validate({
          nodes: reachableNodes,
          edges: reachableEdges,
        });
        if (!result.valid) errors.push(...result.errors);
      } catch (err) {
        console.warn("Validation failed", err);
      }

      return errors;
    },
    [],
  );

  const executeFlow = useCallback(
    async (options = {}) => {
      const { stopOnError = true, executionMode = "calidad" } = options;
      if (!currentProject) return { success: false, error: "No project" };

      // Collaboration validation checks
      if (collab.isCollaborative) {
        if (collab.role !== "owner") {
          const errMessage = "🔒 Only owners can execute the flow.";
          if (toast) toast.error(errMessage);
          return { success: false, error: errMessage };
        }

        const remoteExecution = collab.peers.find(
          (p) => p.executionState?.running,
        );
        if (remoteExecution) {
          const errMessage = `🔒 Cannot execute: ${remoteExecution.user?.name || "Another user"} is running this flow.`;
          if (toast) toast.error(errMessage);
          return {
            success: false,
            error: "Flow is locked by another collaborator",
          };
        }
      }

      // Clear execution states map at start of execution
      if (isCollabActive && clearExecutionStates) {
        clearExecutionStates();
      }

      // Set local execution state in awareness
      if (collab.isCollaborative) {
        const localUser = collab.provider?.awareness?.getLocalState()?.user;
        collab.setExecutionState({
          running: true,
          userId: localUser?.id || "anonymous",
          userName: localUser?.name || "Owner",
          startedAt: Date.now(),
        });
      }

      try {
        executionAbortController.current = new AbortController();
        resetExecutionStates();
        subFlowCache.invalidateAll(currentProject.id);

        if (!options.nodes) {
          const draftMode = useExecutionStore.getState().draftMode;
          const errors = draftMode ? [] : validateFlowStructure(nodes, edges);
          if (errors.length > 0) {
            setApiStatus({ state: "error", message: errors[0] });
            return { success: false, error: errors[0] };
          }
        }

        const globalStats = {
          total: 0,
          successful: 0,
          failed: 0,
          skipped: 0,
          softfailed: 0,
          duration: 0,
        };

        const flowContext = {};
        let browserId = activeBrowserId || null;
        let runId = null;

        try {
          const currentFlowName =
            currentProject?.flows?.find((f) => f.id === currentFlowId)?.name ||
            currentProject?.name ||
            "Flow Execution";

          const { runId: newRunId } = await projectManager.createRun(
            currentProject.id,
            currentFlowId,
            {
              flowName: currentFlowName,
              trigger: options?.executionMode || "manual",
              nodes: nodes.map((n) => ({
                ...n,
                data: { ...n.data, result: undefined },
              })),
              edges,
            },
          );
          runId = newRunId;
          setActiveRunId(runId);
          // Sync with the unified execution store immediately
          useExecutionStore.getState().startExecution({
            mode: executionMode,
            runId: runId,
            flowId: currentFlowId,
            totalNodes: nodes.length,
          });
        } catch (err) {
          console.warn("Run creation failed", err);
        }

        setApiStatus({ state: "loading", message: "Preparing execution..." });

        const getSubFlowCached = async (projectId, flowId) => {
          return subFlowCache.get(projectId, flowId, (pId, fId) =>
            projectManager.getFlow(pId, fId),
          );
        };

        const executeGraph = async (
          graphNodes,
          graphEdges,
          depth = 0,
          visitedFlows = new Set(),
        ) => {
          if (depth > 15) throw new Error("Max recursion depth exceeded");

          const activeNodes = graphNodes.filter((n) => !n.data?.disabled);
          const activeEdges = graphEdges.filter((e) => {
            const s = activeNodes.find((n) => n.id === e.source);
            const t = activeNodes.find((n) => n.id === e.target);
            return s && t;
          });

          if (activeNodes.length === 0) return { success: true };

          let startNodes = activeNodes;
          // Find the true entry points: nodes with no incoming edges. Applied at
          // EVERY depth (not just the root flow) so composite sub-flows also
          // follow their internal edges instead of the arbitrary DB row order.
          if (activeNodes.length > 1 && !options.nodes) {
            const incomingCount = new Map();
            activeNodes.forEach((n) => incomingCount.set(n.id, 0));
            activeEdges.forEach((e) => {
              if (incomingCount.has(e.target)) {
                incomingCount.set(e.target, incomingCount.get(e.target) + 1);
              }
            });
            const roots = activeNodes.filter(
              (n) => incomingCount.get(n.id) === 0,
            );
            startNodes = roots.length > 0 ? orderStartNodes(roots) : [];
            if (startNodes.length === 0 && graphNodes.length > 0) {
              startNodes = [graphNodes[0]];
            }
          } else if (options.nodes) {
            startNodes = options.nodes;
          }

          const internalExecuted = new Set();
          const queue = [...orderStartNodes(startNodes)];
          globalStats.total = activeNodes.length;
          const healedNodes = [];
          let lastResult = { success: true };

          while (queue.length > 0) {
            if (executionAbortController.current?.signal.aborted) break;

            const node = queue.shift();
            if (internalExecuted.has(node.id)) continue;
            internalExecuted.add(node.id);

            let result = { success: true };
            lastResult = result;

            try {
              if (
                node.type === "component" ||
                node.data?.type === "component"
              ) {
                const flowId = getContainerFlowId(node);
                if (flowId) {
                  if (visitedFlows.has(flowId)) {
                    updateNodeState(node.id, NODE_STATES.ERROR, {
                      message: "Circular dependency detected",
                    });
                    return { success: false, error: "Circular dependency" };
                  }
                  setApiStatus({
                    state: "loading",
                    message: `Entering component: ${node.data.label || "Sub-flow"}...`,
                  });
                  const subFlow = await getSubFlowCached(
                    currentProject.id,
                    flowId,
                  );
                  if (subFlow?.nodes?.length > 0) {
                    const newVisited = new Set(visitedFlows);
                    newVisited.add(flowId);
                    updateNodeState(node.id, NODE_STATES.EXECUTING);
                    updateEdgeStatusBySource(node.id, NODE_STATES.EXECUTING);

                    const subResult = await executeGraph(
                      subFlow.nodes,
                      subFlow.edges,
                      depth + 1,
                      newVisited,
                    );
                    result = subResult || { success: true };

                    const isSoftFail =
                      result.status === "softfailed" ||
                      result.data?.status === "softfailed" ||
                      result.result?.data?.status === "softfailed" ||
                      result.result?.data?.data?.status === "softfailed";
                    const finalNodeState = result.success
                      ? isSoftFail
                        ? NODE_STATES.SOFTFAILED
                        : NODE_STATES.SUCCESS
                      : NODE_STATES.ERROR;

                    updateNodeState(node.id, finalNodeState);

                    if (!result.success && stopOnError) {
                      const divePath = result.divePath || [];
                      return {
                        ...result,
                        divePath: [node.id, ...divePath],
                        healedNodes,
                      };
                    }
                    if (result.healedNodes?.length > 0) {
                      healedNodes.push(...result.healedNodes);
                    }
                  } else {
                    updateNodeState(node.id, NODE_STATES.ERROR, {
                      message: `Sub-flow not found or empty: ${flowId}`,
                    });
                    result = { success: false, error: "Missing sub-flow" };
                  }
                }
              } else if (node.type === "loop" || node.data?.type === "loop") {
                const flowId = getContainerFlowId(node);
                const config = node.data?.configuration || {};
                updateNodeState(node.id, NODE_STATES.EXECUTING);
                updateEdgeStatusBySource(node.id, NODE_STATES.EXECUTING);

                let finished = false;
                let loopResult = { success: true };

                while (
                  !finished &&
                  !executionAbortController.current?.signal.aborted
                ) {
                  const resolvedConfig = resolveVariables(config, flowContext);
                  const action = {
                    nodeId: node.id,
                    type: "loop",
                    payload: {
                      ...resolvedConfig,
                      browserId,
                      runId,
                      executionMode,
                    },
                  };

                  const stepResult = await executeStep(action);
                  if (stepResult.instanceId) {
                    browserId = stepResult.instanceId;
                    flowContext.browserId = stepResult.instanceId;
                  }
                  if (!stepResult.success) {
                    loopResult = stepResult;
                    finished = true;
                    break;
                  } else {
                    let logMsg = "";
                    if (executionMode === "performance") {
                      logMsg = `[Performance] Loop Iteration Latency: ${stepResult.duration || 0}ms | Node: "${node.data?.label || "Loop"}" (ID: ${node.id}) | Status: SUCCESS`;
                    } else if (executionMode === "seguridad") {
                      logMsg = `[Security] Loop Iteration on Node: "${node.data?.label || "Loop"}" (ID: ${node.id}) executed | Scanning iteration...`;
                    }
                    if (logMsg) {
                      addLog(logMsg, "success", node.id);
                    }
                  }

                  const path = String(
                    stepResult.path ||
                      stepResult.result?.path ||
                      stepResult.result?.data?.path ||
                      "",
                  )
                    .trim()
                    .toLowerCase();

                  if (
                    path === "completed" ||
                    path === "done" ||
                    path === "finish"
                  ) {
                    finished = true;
                    break;
                  }

                  if (flowId && (path === "body" || path === "iteration")) {
                    setApiStatus({
                      state: "loading",
                      message: `Loop Iteration ${stepResult.result?.data?.index || ""}...`,
                    });
                    const subFlow = await getSubFlowCached(
                      currentProject.id,
                      flowId,
                    );
                    if (subFlow?.nodes?.length > 0) {
                      const subResult = await executeGraph(
                        subFlow.nodes,
                        subFlow.edges,
                        depth + 1,
                      );
                      if (!subResult.success && stopOnError) {
                        loopResult = subResult;
                        finished = true;
                        break;
                      }
                      if (subResult.healedNodes?.length > 0) {
                        healedNodes.push(...subResult.healedNodes);
                      }
                    } else {
                      updateNodeState(node.id, NODE_STATES.ERROR, {
                        message: `Loop sub-flow not found or empty: ${flowId}`,
                      });
                      loopResult = { success: false, error: "Missing loop sub-flow" };
                      finished = true;
                      break;
                    }
                  } else {
                    finished = true;
                  }
                }
                result = loopResult;
                updateNodeState(
                  node.id,
                  result.success ? NODE_STATES.SUCCESS : NODE_STATES.ERROR,
                );
              } else if (
                node.type === "for_each" ||
                node.data?.type === "for_each"
              ) {
                // ForEach is handled entirely by the backend ExecutionService.
                // In frontend debug mode, we treat it as a composition container.
                const config = node.data?.configuration || {};
                updateNodeState(node.id, NODE_STATES.EXECUTING);
                updateEdgeStatusBySource(node.id, NODE_STATES.EXECUTING);

                const resolvedConfig = resolveVariables(config, flowContext);
                const action = {
                  nodeId: node.id,
                  type: "for_each",
                  payload: {
                    ...resolvedConfig,
                    browserId,
                    runId,
                    executionMode,
                  },
                };

                const stepResult = await executeStep(action);
                result = stepResult || { success: true };
                if (stepResult.instanceId) {
                  browserId = stepResult.instanceId;
                  flowContext.browserId = stepResult.instanceId;
                }
                if (result.success) {
                  let logMsg = "";
                  if (executionMode === "performance") {
                    logMsg = `[Performance] ForEach Latency: ${result.duration || 0}ms | Node: "${node.data?.label || "ForEach"}" (ID: ${node.id}) | Status: SUCCESS`;
                  } else if (executionMode === "seguridad") {
                    logMsg = `[Security] ForEach Node: "${node.data?.label || "ForEach"}" (ID: ${node.id}) executed | Scanning container...`;
                  }
                  if (logMsg) {
                    addLog(logMsg, "success", node.id);
                  }
                }

                const forEachFinalState = result.success
                  ? NODE_STATES.SUCCESS
                  : NODE_STATES.ERROR;
                updateNodeState(node.id, forEachFinalState);

                if (!result.success && stopOnError) {
                  return {
                    ...result,
                    divePath: [node.id],
                    healedNodes,
                  };
                }
              } else if (
                node.type !== "input" &&
                node.type !== "output" &&
                node.type !== "annotation"
              ) {
                const nodeType = node.data?.type || node.type;
                const isLogicNode =
                  nodeType === "conditional" ||
                  nodeType === "wait_conditional" ||
                  nodeType === "switch";
                const resolvedConfig = isLogicNode
                  ? node.data?.configuration || {}
                  : resolveVariables(
                      node.data?.configuration || {},
                      flowContext,
                    );

                const action = {
                  nodeId: node.id,
                  type: nodeType,
                  payload: {
                    ...resolvedConfig,
                    browserId,
                    runId,
                    customLabel: node.data?.customLabel,
                    label: node.data?.label,
                    executionMode,
                  },
                };

                // 🚀 FIX: Special flag for variable nodes to allow overwriting dataset values if the value is dynamic/expression
                // This prevents "Set Variable" nodes from being ignored if they are incrementing or calculating values.
                if (
                  nodeType === "variable" &&
                  node.data?.configuration?.value
                ) {
                  const rawValue = String(node.data.configuration.value);
                  if (rawValue.includes("{{") || rawValue.includes("${")) {
                    action.payload.isDynamicValue = true;
                  }
                }

                updateEdgeStatusBySource(node.id, NODE_STATES.EXECUTING);
                result = await executeStep(action);

                const isSoftFailStep =
                  result?.result?.data?.status === "softfailed" ||
                  result?.result?.data?.data?.status === "softfailed";

                if (result.skipped) {
                  globalStats.skipped++;
                } else if (result.success) {
                  if (isSoftFailStep) {
                    globalStats.softfailed++;
                    addLog(
                      `[System] ⚠ Node "${node.data?.label || nodeType}" (ID: ${node.id}) skipped: ${
                        result?.result?.data?.error ||
                        result?.result?.data?.message ||
                        "soft failure"
                      }`,
                      "warning",
                      node.id,
                    );
                  }
                  globalStats.successful++;
                  let logMsg = "";
                  if (executionMode === "performance") {
                    logMsg = `[Performance] Latency: ${result.duration || 0}ms | Node: "${node.data?.label || nodeType}" (ID: ${node.id}) | Status: SUCCESS`;
                  } else if (executionMode === "seguridad") {
                    logMsg = `[Security] Node: "${node.data?.label || nodeType}" (ID: ${node.id}) executed | Scanning node...`;
                  }
                  if (logMsg) {
                    addLog(logMsg, "success", node.id);
                  }
                  if (result.instanceId) {
                    browserId = result.instanceId;
                    flowContext.browserId = result.instanceId;
                  }
                  const slug = (node.data?.label || node.id)
                    .toLowerCase()
                    .replace(/\s+/g, "_");
                  flowContext[node.id] = result.result || result;
                  flowContext[slug] = result.result || result;

                  // Populate custom defined variableName/saveToVariable in flowContext
                  const customVarName =
                    node.data?.configuration?.variableName ||
                    node.data?.configuration?.saveToVariable;
                  if (customVarName) {
                    flowContext[customVarName] = result.result || result;
                  }

                  if (result.healed && result.healedValue) {
                    healedNodes.push({
                      nodeId: node.id,
                      newSelector: result.healedValue,
                    });
                  }
                } else {
                  globalStats.failed++;
                  if (stopOnError) {
                    return {
                      success: false,
                      error: result.error || "Action failed",
                      failedNodeId: node.id,
                      divePath: [],
                    };
                  }
                }
              } else if (node.type === "output") {
                result = {
                  success: true,
                  path:
                    node.data?.configuration?.path ||
                    node.data?.path ||
                    node.id,
                };
              }

              // Path resolution and queueing
              let nextEdges = activeEdges.filter((e) => e.source === node.id);
              const path = String(
                result?.path ||
                  result?.result?.path ||
                  result?.result?.data?.path ||
                  result?.result?.data?.targetPath ||
                  result?.result?.targetPath ||
                  "",
              )
                .trim()
                .toLowerCase();

              const nodeKey = String(
                node.data?.subType || node.data?.type || node.type || "",
              ).toLowerCase();
              const isBranchingNode =
                nodeKey === "switch" ||
                nodeKey === "conditional" ||
                nodeKey === "backend_js";

              const shouldEnforceStrictPath =
                nodeKey === "switch" || nodeKey === "conditional";

              const hasPath = !!path && path !== "undefined" && path !== "";

              // 1. Resolve the winner edge(s) for this node. For strict
              //    branching nodes (conditional/switch) only the edge whose
              //    sourceHandle matches the winning path must survive; every
              //    other outgoing edge belongs to a branch whose condition was
              //    not satisfied and must be excluded from execution this cycle.
              let winnerEdges = nextEdges;
              if (hasPath) {
                const matched = nextEdges.filter((e) =>
                  matchesBranchPath(e.sourceHandle, path),
                );

                if (shouldEnforceStrictPath || isBranchingNode) {
                  winnerEdges = matched;
                  if (matched.length === 0 && nextEdges.length > 0) {
                    if (shouldEnforceStrictPath) {
                      updateNodeState(node.id, NODE_STATES.ERROR, {
                        message: `Path not found: ${path}`,
                      });
                      winnerEdges = [];
                    } else {
                      winnerEdges = [];
                    }
                  }
                } else if (matched.length > 0) {
                  winnerEdges = matched;
                }
              } else if (shouldEnforceStrictPath && nextEdges.length > 0) {
                updateNodeState(node.id, NODE_STATES.ERROR, {
                  message: "Could not resolve branching path",
                });
                winnerEdges = [];
              }

              // 2. Explicitly short-circuit the non-selected branches so they
              //    are never queued for execution in this cycle. Mark them as
              //    skipped (visually and conceptually) — they carry the side
              //    effects of branches whose conditions did not hold.
              const skippedEdges = nextEdges.filter(
                (e) => !winnerEdges.includes(e),
              );
              skippedEdges.forEach((e) => {
                updateEdgeStatus(e.id, NODE_STATES.SKIPPED, false);
              });

              // 3. Paint winners, then enqueue only the winner branch targets.
              winnerEdges.forEach((e) => {
                if (result.success) {
                  updateEdgeStatus(e.id, NODE_STATES.SUCCESS, false);
                } else {
                  updateEdgeStatus(e.id, NODE_STATES.ERROR, false);
                }
              });

              winnerEdges.forEach((e) => {
                const targetNode = activeNodes.find((n) => n.id === e.target);
                if (targetNode) queue.push(targetNode);
              });
            } catch (err) {
              console.error(`Error in node "${node.id}":`, err);
              globalStats.failed++;
              updateNodeState(node.id, NODE_STATES.ERROR, {
                message: err.message,
              });
              if (stopOnError) {
                return {
                  success: false,
                  error: err.message,
                  failedNodeId: node.id,
                  divePath: [],
                };
              }
            }
          }
          return { success: lastResult.success, healedNodes, browserId };
        };

        const finalResult = await executeGraph(options.nodes || nodes, edges);

        const wasAborted = executionAbortController.current?.signal.aborted;

        if (runId)
          await api.post(`/runs/${runId}/end`, {
            status: wasAborted ? "stopped" : "completed",
          });

        if (wasAborted) {
          setApiStatus({ state: "idle", message: "Execution stopped" });
          window.dispatchEvent(
            new CustomEvent("hal:run-completed", {
              detail: { runId, status: "stopped", executionMode },
            }),
          );
          return {
            ...finalResult,
            stats: globalStats,
            cancelled: true,
          };
        }

        setApiStatus({ state: "success", message: "Flow complete" });
        window.dispatchEvent(
          new CustomEvent("hal:run-completed", {
            detail: { runId, status: "completed", executionMode },
          }),
        );
        return { ...finalResult, stats: globalStats };
      } finally {
        if (collab.isCollaborative) {
          collab.setExecutionState(null);
        }
      }
    },
    [
      currentProject,
      currentFlowId,
      nodes,
      edges,
      executeStep,
      resetExecutionStates,
      validateFlowStructure,
      updateNodeState,
      updateEdgeStatus,
      updateEdgeStatusBySource,
      activeBrowserId,
      setActiveRunId,
      setApiStatus,
      collab,
      isCollabActive,
      clearExecutionStates,
      toast,
      addLog,
    ],
  );

  return {
    isLoading,
    apiStatus,
    setApiStatus,
    executionStats,
    activeBrowserId,
    setActiveBrowserId,
    activeRunId,
    isReadOnly,
    stopSession,
    resetExecutionStates,
    updateNodeScreenshot,
    captureScreenshot,
    validateFlowStructure,
    executeStep,
    executeFlow,
  };
}
