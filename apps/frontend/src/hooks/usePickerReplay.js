import { useCallback, useRef, useState } from "react";
import { api } from "../utils/api";
import { NODE_STATES } from "../components/hooks/flowStyles";
import { getTopologicalPathToNode } from "../utils/graphUtils";

const REPLAY_TIMEOUT_MS = 60_000;
const SKIP_TYPES = new Set(["close_browser"]);
const NON_EXECUTABLE = new Set([
  "sticky_note",
  "discussion",
  "guide",
  "note",
  "comment",
  "annotation",
  "label",
  "variable",
  "input",
  "output",
]);

export function usePickerReplay({
  nodes,
  edges,
  activeBrowserId,
  setActiveBrowserId,
  updateNodeState,
}) {
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayProgress, setReplayProgress] = useState(null);
  const abortRef = useRef(null);

  const executeReplayStep = useCallback(async (node, browserId) => {
    const nodeType = node.data?.type || node.type;
    const endpoint = `/actions/${nodeType}`;
    const configuration = node.data?.configuration || {};

    const body = {
      ...configuration,
      nodeId: node.id,
      debugMode: true,
    };

    if (browserId) {
      body.browserId = browserId;
    }

    const result = await api.post(endpoint, body, {
      signal: abortRef.current?.signal,
    });

    const newBrowserId =
      result.data?.browserId ?? result.browserId ?? browserId ?? null;

    return {
      success: true,
      result,
      browserId: newBrowserId,
    };
  }, []);

  const executeToNode = useCallback(
    async (targetNodeId) => {
      if (isReplaying) {
        return { error: { message: "Replay already in progress" } };
      }

      const path = getTopologicalPathToNode(targetNodeId, nodes, edges);

      if (path.length === 0) {
        return { browserId: activeBrowserId, skipped: true };
      }

      const executableSteps = path.filter(
        (n) =>
          !NON_EXECUTABLE.has(n.data?.type || n.type) &&
          !SKIP_TYPES.has(n.data?.type || n.type),
      );

      if (executableSteps.length === 0) {
        return { browserId: activeBrowserId, skipped: true };
      }

      setIsReplaying(true);
      setReplayProgress({ current: 0, total: executableSteps.length });
      abortRef.current = new AbortController();

      const timeoutId = setTimeout(() => {
        abortRef.current?.abort();
      }, REPLAY_TIMEOUT_MS);

      let currentBrowserId = activeBrowserId;

      try {
        for (let i = 0; i < executableSteps.length; i++) {
          if (abortRef.current?.signal.aborted) {
            throw new Error("Replay timed out");
          }

          const step = executableSteps[i];
          const nodeType = step.data?.type || step.type;
          const nodeLabel =
            step.data?.customLabel || step.data?.label || nodeType;

          setReplayProgress({
            current: i + 1,
            total: executableSteps.length,
            stepLabel: nodeLabel,
          });

          if (updateNodeState) {
            updateNodeState(step.id, NODE_STATES.PICKER_REPLAYING);
          }

          try {
            const stepResult = await executeReplayStep(step, currentBrowserId);

            if (stepResult.browserId) {
              currentBrowserId = stepResult.browserId;
              if (setActiveBrowserId) {
                setActiveBrowserId(stepResult.browserId);
              }
              localStorage.setItem("lastBrowserId", stepResult.browserId);
            }

            if (updateNodeState) {
              updateNodeState(step.id, NODE_STATES.SUCCESS);
            }
          } catch (stepError) {
            if (updateNodeState) {
              updateNodeState(step.id, NODE_STATES.ERROR, {
                message: stepError.message,
              });
            }

            const stepLabel =
              step.data?.customLabel || step.data?.label || nodeType;

            return {
              error: {
                nodeId: step.id,
                nodeLabel: stepLabel,
                nodeType,
                message: stepError.message,
                failedAtStep: i + 1,
                totalSteps: executableSteps.length,
              },
              browserId: currentBrowserId,
            };
          }
        }

        return { browserId: currentBrowserId };
      } finally {
        clearTimeout(timeoutId);
        setIsReplaying(false);
        setReplayProgress(null);
        abortRef.current = null;
      }
    },
    [
      nodes,
      edges,
      activeBrowserId,
      setActiveBrowserId,
      updateNodeState,
      executeReplayStep,
      isReplaying,
    ],
  );

  const cancelReplay = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  const replayAndExecuteNode = useCallback(
    async (targetNodeId, executeStep, overrideConfig) => {
      if (isReplaying) {
        return { error: { message: "Replay already in progress" } };
      }

      const replayResult = await executeToNode(targetNodeId);

      if (replayResult.error) {
        return replayResult;
      }

      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      const targetNode = nodeMap.get(targetNodeId);

      if (!targetNode) {
        return { error: { message: `Node ${targetNodeId} not found` } };
      }

      const nodeType = targetNode.data?.type || targetNode.type;

      if (SKIP_TYPES.has(nodeType) || NON_EXECUTABLE.has(nodeType)) {
        return { browserId: replayResult.browserId, skipped: true };
      }

      const configuration =
        overrideConfig || targetNode.data?.configuration || {};

      if (updateNodeState) {
        updateNodeState(targetNodeId, NODE_STATES.EXECUTING);
      }

      try {
        const result = await executeStep(targetNode, nodeType, configuration, {
          browserId: replayResult.browserId,
          debugMode: false,
        });

        if (updateNodeState) {
          updateNodeState(targetNodeId, NODE_STATES.SUCCESS);
        }

        const finalBrowserId =
          result?.browserId || replayResult.browserId || activeBrowserId;

        return { browserId: finalBrowserId, result };
      } catch (stepError) {
        if (updateNodeState) {
          updateNodeState(targetNodeId, NODE_STATES.ERROR, {
            message: stepError.message,
          });
        }

        return {
          error: {
            nodeId: targetNodeId,
            nodeType,
            message: stepError.message,
          },
          browserId: replayResult.browserId,
        };
      }
    },
    [nodes, activeBrowserId, updateNodeState, executeToNode, isReplaying],
  );

  return {
    executeToNode,
    replayAndExecuteNode,
    cancelReplay,
    isReplaying,
    replayProgress,
  };
}
