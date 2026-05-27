import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { logger } from "../../utils/logger";
import { api } from "../../utils/api";
import { projectManager } from "../../utils/ProjectManager";
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
import { resolveVariables } from "../../utils/flowUtils";

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const resetExecutionStatesRecursively = (list) => {
  return list.map((node) => {
    let newNode = {
      ...node,
      data: {
        ...node.data,
        state: NODE_STATES.DEFAULT,
        executed: false,
        errorDetails: null,
        error: null,
        executionTime: null,
      },
      style: getNodeStyle(NODE_STATES.DEFAULT, node.style),
    };
    if (
      (newNode.type === "component" || newNode.data?.type === "component") &&
      newNode.data?.subFlow?.nodes
    ) {
      newNode.data.subFlow.nodes = resetExecutionStatesRecursively(
        newNode.data.subFlow.nodes,
      );
    }
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
}) {
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
    if (!activeBrowserId) return;

    try {
      setApiStatus({ state: "loading", message: "Stopping session..." });
      await api.post("/actions/close_browser", { browserId: activeBrowserId });
      setActiveBrowserId(null);
      setApiStatus({ state: "idle", message: "Session stopped" });
      if (toast) toast.success("Browser session closed");
    } catch (error) {
      console.error("Failed to stop session:", error);
      if (toast) toast.error("Failed to close browser session");
    }
  }, [activeBrowserId, setApiStatus, toast]);

  const resetExecutionStates = useCallback(() => {
    setNodes((nds) => resetExecutionStatesRecursively(nds));
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        animated: false,
        data: { ...e.data, executionState: "default" },
      })),
    );
    setExecutionStats({
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
    });
    setApiStatus({ state: "idle", message: "Node states reset" });
  }, [setNodes, setEdges]);

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
    [setEdges],
  );

  const updateEdgeStatusBySource = useCallback(
    (sourceId, state, animated = true) => {
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
    [setEdges],
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
          data.screenshot || data.image || data.data || data.data?.screenshot;
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
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
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
          if (error.name !== "AbortError" && attempt < MAX_RETRIES - 1) {
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

      for (const n of executionNodes) {
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

      const targets = new Set(filteredEdges.map((e) => e.target));
      const roots = executionNodes.filter((n) => !targets.has(n.id));

      if (roots.length === 0) errors.push("No starting point found");
      else if (roots.length > 1)
        errors.push("Multiple starting points detected");
      else if (roots[0].type !== "launch_browser")
        errors.push("First node must be 'Launch Browser'");

      try {
        const result = GraphValidator.validate({
          nodes: executionNodes,
          edges: filteredEdges,
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
      const { stopOnError = true } = options;
      if (!currentProject) return { success: false, error: "No project" };

      executionAbortController.current = new AbortController();
      resetExecutionStates();

      if (!options.nodes) {
        const errors = validateFlowStructure(nodes, edges);
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
        duration: 0,
      };

      const flowContext = {};
      let browserId = activeBrowserId || null;
      let runId = null;

      try {
        const { runId: newRunId } = await projectManager.createRun(
          currentProject.id,
          currentFlowId,
          {
            nodes: nodes.map((n) => ({
              ...n,
              data: { ...n.data, result: undefined },
            })),
            edges,
          },
        );
        runId = newRunId;
        setActiveRunId(runId);
      } catch (err) {
        console.warn("Run creation failed", err);
      }

      setApiStatus({ state: "loading", message: "Preparing execution..." });

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
        if (depth === 0 && activeNodes.length > 1 && !options.nodes) {
          const incomingCount = new Map();
          activeNodes.forEach((n) => incomingCount.set(n.id, 0));
          activeEdges.forEach((e) => {
            if (incomingCount.has(e.target)) {
              incomingCount.set(e.target, incomingCount.get(e.target) + 1);
            }
          });
          startNodes = activeNodes.filter((n) => incomingCount.get(n.id) === 0);
          if (startNodes.length === 0 && graphNodes.length > 0) {
            startNodes = [graphNodes[0]];
          }
        } else if (options.nodes) {
          startNodes = options.nodes;
        }

        const internalExecuted = new Set();
        const queue = [...startNodes];
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
            if (node.type === "component" || node.data?.type === "component") {
              const { flowId } = node.data || {};
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
                const subFlow = await projectManager.getFlow(
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
                    result.data?.status === "softfailed";
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
                }
              }
            } else if (node.type === "loop" || node.data?.type === "loop") {
              const { flowId } = node.data || {};
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
                  payload: { ...resolvedConfig, browserId, runId },
                };

                const stepResult = await executeStep(action);
                if (!stepResult.success) {
                  loopResult = stepResult;
                  finished = true;
                  break;
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
                  const subFlow = await projectManager.getFlow(
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
                    finished = true;
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
                : resolveVariables(node.data?.configuration || {}, flowContext);

              const action = {
                nodeId: node.id,
                type: nodeType,
                payload: {
                  ...resolvedConfig,
                  browserId,
                  runId,
                  customLabel: node.data?.customLabel,
                  label: node.data?.label,
                },
              };

              updateEdgeStatusBySource(node.id, NODE_STATES.EXECUTING);
              result = await executeStep(action);

              if (result.skipped) {
                globalStats.skipped++;
              } else if (result.success) {
                globalStats.successful++;
                if (result.instanceId) {
                  browserId = result.instanceId;
                  flowContext.browserId = result.instanceId;
                }
                const slug = (node.data?.label || node.id)
                  .toLowerCase()
                  .replace(/\s+/g, "_");
                flowContext[node.id] = result.result || result;
                flowContext[slug] = result.result || result;

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
                  node.data?.configuration?.path || node.data?.path || node.id,
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

            if (path && path !== "undefined" && path !== "") {
              let filtered = nextEdges.filter((e) => {
                const handle = String(e.sourceHandle || "").toLowerCase();
                const targetPath = String(path).toLowerCase();
                if (handle === targetPath) return true;
                if (
                  targetPath === "false" &&
                  (handle === "else" || handle === "fallback")
                )
                  return true;
                if (targetPath === "else" && handle === "false") return true;
                return false;
              });

              if (shouldEnforceStrictPath || isBranchingNode) {
                if (filtered.length === 0 && nextEdges.length > 0) {
                  if (shouldEnforceStrictPath) {
                    updateNodeState(node.id, NODE_STATES.ERROR, {
                      message: `Path not found: ${path}`,
                    });
                    nextEdges = [];
                  } else {
                    nextEdges = [];
                  }
                } else {
                  nextEdges = filtered;
                }
              } else if (filtered.length > 0) {
                nextEdges = filtered;
              }
            } else if (shouldEnforceStrictPath && nextEdges.length > 0) {
              updateNodeState(node.id, NODE_STATES.ERROR, {
                message: "Could not resolve branching path",
              });
              nextEdges = [];
            }

            nextEdges.forEach((e) => {
              if (result.success) {
                const hasPath = path && path !== "undefined" && path !== "";
                if (
                  shouldEnforceStrictPath &&
                  hasPath &&
                  String(e.sourceHandle || "").toLowerCase() !== path
                ) {
                  return;
                }
                updateEdgeStatus(e.id, NODE_STATES.SUCCESS, false);
              } else {
                updateEdgeStatus(e.id, NODE_STATES.ERROR, false);
              }
            });

            nextEdges.forEach((e) => {
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
        return { success: lastResult.success, healedNodes };
      };

      const finalResult = await executeGraph(options.nodes || nodes, edges);
      if (runId) await api.post(`/runs/${runId}/end`, { status: "completed" });
      setApiStatus({ state: "success", message: "Flow complete" });
      return { ...finalResult, stats: globalStats };
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
    ],
  );

  return {
    isLoading,
    apiStatus,
    setApiStatus,
    executionStats,
    activeBrowserId,
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
