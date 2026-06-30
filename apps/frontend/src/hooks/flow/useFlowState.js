import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { applyNodeChanges, applyEdgeChanges, addEdge } from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "../useToast";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  NODE_LABELS,
  NODE_STATES,
  getNodeStyle,
} from "../../components/hooks/flowStyles";
import { CATEGORY_STYLES, NODE_TYPE_MAP } from "../../config/nodeConstants";
import { wouldCreateCycle } from "../../utils/flowUtils";
import { calculateDesignTimeContext } from "../../utils/graphPropagation";
import { getLayoutedElements } from "../../utils/layoutUtils";
import { projectManager } from "../../utils/ProjectManager";
import { logger } from "../../utils/logger";

const DEFAULT_EDGE_OPTIONS = {
  animated: true,
  style: {
    stroke: "#ff8c32", // hal-orange
    strokeWidth: 2,
  },
  markerEnd: {
    type: "arrowclosed",
    width: 20,
    height: 20,
    color: "#ff8c32",
  },
  focusable: true,
  deletable: true,
};

export const generateNodeId = () => `node_${uuidv4()}`;

export const updateNodeRecursively = (nodes, nodeId, updater) => {
  let hasChanges = false;
  const nextNodes = nodes.map((node) => {
    const targetId =
      typeof nodeId === "object" ? nodeId.id || nodeId.nodeId : nodeId;
    if (node.id === targetId) {
      hasChanges = true;
      return updater(node);
    }
    if (node.data?.subFlow?.nodes) {
      const nextSubNodes = updateNodeRecursively(
        node.data.subFlow.nodes,
        nodeId,
        updater,
      );
      if (nextSubNodes !== node.data.subFlow.nodes) {
        hasChanges = true;
        return {
          ...node,
          data: {
            ...node.data,
            subFlow: {
              ...node.data.subFlow,
              nodes: nextSubNodes,
            },
          },
        };
      }
    }
    return node;
  });
  return hasChanges ? nextNodes : nodes;
};

export const sanitizeEdges = (edgesList, nodesList) => {
  if (!Array.isArray(edgesList) || !Array.isArray(nodesList)) return [];

  const nodeIds = new Set(nodesList.map((n) => n.id));
  const seenEdgeIds = new Set();
  const seenConnections = new Set();

  return edgesList
    .filter((edge) => {
      if (!edge || !edge.id || !edge.source || !edge.target) {
        return false;
      }

      // 1. Source and target nodes must exist in the nodes list
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        return false;
      }

      // 2. Prevent duplicate edge IDs
      if (seenEdgeIds.has(edge.id)) {
        return false;
      }
      seenEdgeIds.add(edge.id);

      // 3. Prevent duplicate connections between same source/sourceHandle and target/targetHandle
      const connKey = `${edge.source}::${edge.sourceHandle || ""} -> ${edge.target}::${edge.targetHandle || ""}`;
      if (seenConnections.has(connKey)) {
        return false;
      }
      seenConnections.add(connKey);

      return true;
    })
    .map((edge) => ({
      ...edge,
      type: edge.type || "custom",
      animated: edge.animated !== false,
    }));
};

export function useFlowState({ currentProject, currentFlowId } = {}) {
  const toastHook = useToast();
  const { t: tHook } = useTranslation();
  const queryClient = useQueryClient();
  const saveFlowRef = useRef(null);

  const setSaveFlow = useCallback((fn) => {
    saveFlowRef.current = fn;
  }, []);

  const [rawNodes, _setNodes] = useState([]);

  const sanitizeNodes = useCallback((nds) => {
    if (!Array.isArray(nds)) return [];
    return nds
      .map((node, index) => {
        if (!node) return null;

        const id = node.id || `node_${index}_${Date.now()}`;
        const type = node.type || node.data?.type || "default";
        const data = node.data || {};

        let position = node.position;
        if (
          !position ||
          typeof position.x !== "number" ||
          typeof position.y !== "number" ||
          isNaN(position.x) ||
          isNaN(position.y)
        ) {
          logger.warn(
            `[Sanitizer] Fixed missing/corrupt position for node ${id}. Falling back.`,
          );
          position = {
            x:
              position && typeof position.x === "number" && !isNaN(position.x)
                ? position.x
                : index * 250,
            y:
              position && typeof position.y === "number" && !isNaN(position.y)
                ? position.y
                : 150,
          };
        }

        return {
          ...node,
          id,
          type,
          data: {
            ...data,
            type: data.type || type,
          },
          position,
        };
      })
      .filter(Boolean);
  }, []);

  const setNodes = useCallback(
    (updater) => {
      _setNodes((prevNodes) => {
        const next =
          typeof updater === "function" ? updater(prevNodes) : updater;
        return sanitizeNodes(next);
      });
    },
    [sanitizeNodes],
  );

  const nodes = rawNodes;
  const [edges, setEdges] = useState([]);
  const [history, setHistory] = useState({ past: [], future: [] });
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [clipboard, setClipboard] = useState({ nodes: [], edges: [] });

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const saveToHistory = useCallback(() => {
    setHistory((prev) => ({
      past: [
        ...prev.past.slice(-19),
        { nodes: nodesRef.current, edges: edgesRef.current },
      ],
      future: [],
    }));
  }, []);

  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const nextNodes = applyNodeChanges(changes, nds);
        // Special logic for selection
        const hasSelectChange = changes.some((c) => c.type === "select");
        if (hasSelectChange) {
          const newlySelected = nextNodes.find((n) => n.selected);
          setSelectedNodeId(newlySelected ? newlySelected.id : null);
        }
        const hasRemoveChange = changes.some((c) => c.type === "remove");
        if (hasRemoveChange) {
          setEdges((eds) => sanitizeEdges(eds, nextNodes));
        }
        return nextNodes;
      });
      setHasUnsavedChanges(true);
    },
    [setNodes, setEdges],
  );

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
    setHasUnsavedChanges(true);
  }, []);

  const onConnect = useCallback((params) => {
    if (wouldCreateCycle(params, nodesRef.current, edgesRef.current)) {
      return;
    }
    setEdges((eds) => addEdge({ ...params, ...DEFAULT_EDGE_OPTIONS }, eds));
    setHasUnsavedChanges(true);
  }, []);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const addNode = useCallback(
    (type, position, data = {}) => {
      const newNode = {
        id: generateNodeId(),
        type,
        position,
        data: {
          ...data,
          label: NODE_LABELS[type] || type,
          type,
          state: NODE_STATES.DEFAULT,
        },
      };
      setNodes((nds) => [...nds, newNode]);
      setHasUnsavedChanges(true);
      return newNode;
    },
    [setNodes],
  );

  const deleteNode = useCallback(
    (nodeId) => {
      saveToHistory();
      const nextNodes = nodesRef.current.filter((n) => n.id !== nodeId);
      const nextEdges = sanitizeEdges(
        edgesRef.current.filter(
          (e) => e.source !== nodeId && e.target !== nodeId,
        ),
        nextNodes,
      );
      setNodes(nextNodes);
      setEdges(nextEdges);
      setHasUnsavedChanges(true);
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [saveToHistory, selectedNodeId, setNodes, setEdges],
  );

  const updateNodeState = useCallback(
    (nodeId, state, options = {}) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                state,
                statusMessage: options.message,
                lastUpdate: new Date().toISOString(),
                // Persist healing data for HEALED state
                ...(options.originalValue !== undefined && {
                  originalValue: options.originalValue,
                }),
                ...(options.healedValue !== undefined && {
                  healedValue: options.healedValue,
                }),
                ...(options.selector !== undefined && {
                  selector: options.selector,
                }),
              },
              style: getNodeStyle(state, node.style),
            };
          }
          return node;
        }),
      );
    },
    [setNodes],
  );

  const clearFlow = useCallback(
    (setApiStatus) => {
      saveToHistory();
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      if (setApiStatus)
        setApiStatus({ state: "idle", message: "Canvas cleared" });
    },
    [saveToHistory, setNodes, setEdges],
  );

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);

      setNodes(previous.nodes);
      setEdges(previous.edges);

      return {
        past: newPast,
        future: [
          { nodes: nodesRef.current, edges: edgesRef.current },
          ...prev.future,
        ],
      };
    });
  }, [setNodes, setEdges]);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);

      setNodes(next.nodes);
      setEdges(next.edges);

      return {
        past: [
          ...prev.past,
          { nodes: nodesRef.current, edges: edgesRef.current },
        ],
        future: newFuture,
      };
    });
  }, [setNodes, setEdges]);

  const groupNodes = useCallback(
    async (projectParam, flowIdParam, queryClientParam) => {
      const activeProject = projectParam || currentProject;
      const activeFlowId = flowIdParam || currentFlowId;
      const activeQueryClient = queryClientParam || queryClient;

      if (!activeProject || !activeFlowId) {
        toastHook.error("Missing project or flow context for grouping");
        return;
      }

      // 1. Identify selected nodes
      const selectedNodes = nodesRef.current.filter((n) => n.selected);
      if (selectedNodes.length < 2) {
        toastHook.error(
          tHook("groups.min_selection", "Select at least 2 nodes to group"),
        );
        return;
      }

      // ⛔ NESTING RULE (V1): Prevent nesting components
      const hasComponent = selectedNodes.some(
        (n) => n.type === "component" || n.data?.type === "component",
      );
      if (hasComponent) {
        toastHook.error(
          tHook(
            "groups.no_nesting",
            "Grouping components is not supported yet",
          ),
        );
        return;
      }

      saveToHistory();

      // 2. Calculate Bounding Box
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      selectedNodes.forEach((n) => {
        minX = Math.min(minX, n.position.x);
        minY = Math.min(minY, n.position.y);
        maxX = Math.max(maxX, n.position.x + (n.width || 200));
        maxY = Math.max(maxY, n.position.y + (n.height || 100));
      });

      const groupWidth = maxX - minX;
      const groupHeight = maxY - minY;

      // 4. Extract Sub-Flow Logic
      const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));

      // Internal Edges: Both Source and Target inside group (Keep them)
      const internalEdges = edgesRef.current.filter(
        (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target),
      );

      // External Incoming: Source OUTSIDE, Target INSIDE (Needs Input Node)
      const externalIncoming = edgesRef.current.filter(
        (e) => !selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target),
      );

      // External Outgoing: Source INSIDE, Target OUTSIDE (Needs Output Node)
      const externalOutgoing = edgesRef.current.filter(
        (e) => selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target),
      );

      // ---------------------------------------------------------
      // GENERATE SUB-FLOW NODES (Normalized + Boundaries)
      // ---------------------------------------------------------
      const subNodes = selectedNodes.map((n) => ({
        ...n,
        position: {
          x: n.position.x - minX,
          y: n.position.y - minY,
        },
        selected: false,
        parentNode: null,
        extent: undefined, // Clear extent if parent related
      }));

      const finalSubEdges = [...(internalEdges || [])]; // Start with internal edges

      // -> HANDLE INPUT BOUNDARY
      if (externalIncoming.length > 0) {
        const inputId = `input_${uuidv4()}`;
        const inputNode = {
          id: inputId,
          type: "input",
          position: { x: -250, y: groupHeight / 2 - 25 }, // Left of content
          data: { label: "Input" },
        };
        subNodes.push(inputNode);

        // Connect Input Node -> Original Targets of incoming edges
        externalIncoming.forEach((edge) => {
          const newInternalEdge = {
            id: `e_${inputId}-${edge.target}`,
            source: inputId,
            target: edge.target,
            type: "default",
            animated: true,
          };
          finalSubEdges.push(newInternalEdge);
        });
      }

      // -> HANDLE OUTPUT BOUNDARY
      if (externalOutgoing.length > 0) {
        const outputId = `output_${uuidv4()}`;
        const outputNode = {
          id: outputId,
          type: "output",
          position: { x: groupWidth + 200, y: groupHeight / 2 - 25 }, // Right of content
          data: { label: "Output" },
        };
        subNodes.push(outputNode);

        // Connect Original Sources -> Output Node
        externalOutgoing.forEach((edge) => {
          const newInternalEdge = {
            id: `e_${edge.source}-${outputId}`,
            source: edge.source,
            target: outputId,
            type: "default",
            animated: true,
          };
          finalSubEdges.push(newInternalEdge);
        });
      }

      try {
        // 5. Create Component Flow via API
        const componentName = `Component ${new Date().toLocaleTimeString()}`;
        const response = await projectManager.createFlow(
          activeProject.id,
          componentName,
          {
            type: "component",
            parentId: activeFlowId,
            nodes: subNodes,
            edges: finalSubEdges,
          },
        );

        const newFlow = response?.flow || response;
        if (!newFlow || !newFlow.id)
          throw new Error("Failed to create component flow");

        // REFRESH PROJECT DATA (Optimistic Update for Instant UI)
        if (activeQueryClient) {
          if (response?.project) {
            activeQueryClient.setQueryData(
              ["project", activeProject.id],
              response.project,
            );
          } else {
            activeQueryClient.setQueryData(
              ["project", activeProject.id],
              (old) => {
                if (!old) return old;
                const flows = old.flows || [];
                if (flows.some((f) => f.id === newFlow.id)) return old;
                return {
                  ...old,
                  flows: [...flows, newFlow],
                };
              },
            );
          }
          activeQueryClient.invalidateQueries({
            queryKey: ["project", activeProject.id],
          });
        }

        // 6. Create The Component Node in Main Flow
        const componentId = generateNodeId();
        const componentNode = {
          id: componentId,
          type: "component",
          position: { x: minX, y: minY }, // Use top-left of group
          width: groupWidth, // Optional: preserve dimensions?
          height: groupHeight,
          data: {
            label: componentName,
            type: "component",
            flowId: newFlow.id,
            configuration: {
              flowId: newFlow.id,
            },
            nodeCount: subNodes.length,
            hasInput: subNodes.some((n) => n.type === "input"),
            hasOutput: subNodes.some((n) => n.type === "output"),
            subFlow: { nodes: subNodes, edges: finalSubEdges }, // Include edges for stats and restoration
          },
          style: getNodeStyle ? getNodeStyle(NODE_STATES.DEFAULT) : {},
        };

        // 7. Update Main Flow State
        const remainingNodes = nodesRef.current.filter(
          (n) => !selectedNodeIds.has(n.id),
        );

        const remainingEdges = edgesRef.current.filter(
          (e) =>
            !selectedNodeIds.has(e.source) &&
            !selectedNodeIds.has(e.target) &&
            !externalIncoming.includes(e) &&
            !externalOutgoing.includes(e),
        );

        // Rewire Main Flow Edges to Component Node
        // Incoming: Original Source -> Component Node
        const newIncomingEdges = externalIncoming.map((e) => ({
          ...e,
          id: `e_${e.source}-${componentId}_${e.target}_${e.targetHandle || "default"}`,
          target: componentId,
          targetHandle: null, // component node doesn't have target handles
          data: {
            ...(e.data || {}),
            originalTarget: e.target,
            originalTargetHandle: e.targetHandle,
          },
        }));

        // Outgoing: Component Node -> Original Target
        const newOutgoingEdges = externalOutgoing.map((e) => ({
          ...e,
          id: `e_${componentId}_${e.source}_${e.sourceHandle || "default"}-${e.target}`,
          source: componentId,
          sourceHandle: null, // component node doesn't have source handles
          data: {
            ...(e.data || {}),
            originalSource: e.source,
            originalSourceHandle: e.sourceHandle,
          },
        }));

        const nextNodes = [...remainingNodes, componentNode];
        const nextEdges = sanitizeEdges(
          [...remainingEdges, ...newIncomingEdges, ...newOutgoingEdges],
          nextNodes,
        );

        // Synchronously update refs to prevent race condition during save
        nodesRef.current = nextNodes;
        edgesRef.current = nextEdges;

        setNodes(nextNodes);
        setEdges(nextEdges);

        // Persist changes immediately
        if (saveFlowRef.current) {
          await saveFlowRef.current();
        }

        // AUTO-FOCUS: Select Node and Open Inspector
        setTimeout(() => {
          setSelectedNodeId(componentId);
        }, 50);

        toastHook.success(tHook("groups.success", "Grouped into Component"));
      } catch (error) {
        console.error("Failed to group nodes:", error);
        toastHook.error(tHook("groups.error", "Failed to create component"));
      }
    },
    [
      currentProject,
      currentFlowId,
      queryClient,
      saveToHistory,
      setNodes,
      setEdges,
      setSelectedNodeId,
      toastHook,
      tHook,
    ],
  );

  const loopNodes = useCallback(
    async (projectParam, flowIdParam, queryClientParam) => {
      const activeProject = projectParam || currentProject;
      const activeFlowId = flowIdParam || currentFlowId;
      const activeQueryClient = queryClientParam || queryClient;

      if (!activeProject || !activeFlowId) {
        toastHook.error("Missing project or flow context for looping");
        return;
      }

      // 1. Identify selected nodes
      const selectedNodes = nodesRef.current.filter((n) => n.selected);
      if (selectedNodes.length < 2) {
        toastHook.error(
          tHook("groups.min_selection", "Select at least 2 nodes to loop"),
        );
        return;
      }

      saveToHistory();

      // 2. Calculate Bounding Box
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      selectedNodes.forEach((n) => {
        minX = Math.min(minX, n.position.x);
        minY = Math.min(minY, n.position.y);
        maxX = Math.max(maxX, n.position.x + (n.width || 200));
        maxY = Math.max(maxY, n.position.y + (n.height || 100));
      });

      const groupWidth = maxX - minX;
      const groupHeight = maxY - minY;

      // 4. Extract Sub-Flow Logic
      const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));

      // Internal Edges: Both Source and Target inside group (Keep them)
      const internalEdges = edgesRef.current.filter(
        (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target),
      );

      // External Incoming: Source OUTSIDE, Target INSIDE (Needs Input Node)
      const externalIncoming = edgesRef.current.filter(
        (e) => !selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target),
      );

      // External Outgoing: Source INSIDE, Target OUTSIDE (Needs Output Node)
      const externalOutgoing = edgesRef.current.filter(
        (e) => selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target),
      );

      // ---------------------------------------------------------
      // GENERATE SUB-FLOW NODES (Normalized + Boundaries)
      // ---------------------------------------------------------
      const subNodes = selectedNodes.map((n) => ({
        ...n,
        position: {
          x: n.position.x - minX,
          y: n.position.y - minY,
        },
        selected: false,
        parentNode: null,
        extent: undefined,
      }));

      const finalSubEdges = [...(internalEdges || [])];

      // -> HANDLE INPUT BOUNDARY
      if (externalIncoming.length > 0) {
        const inputId = `input_${uuidv4()}`;
        const inputNode = {
          id: inputId,
          type: "input",
          position: { x: -250, y: groupHeight / 2 - 25 },
          data: { label: "Input", type: "input" },
        };
        subNodes.push(inputNode);

        externalIncoming.forEach((edge) => {
          finalSubEdges.push({
            id: `e_${inputId}-${edge.target}`,
            source: inputId,
            target: edge.target,
            type: "default",
            animated: true,
          });
        });
      }

      // -> HANDLE OUTPUT BOUNDARY
      if (externalOutgoing.length > 0) {
        const outputId = `output_${uuidv4()}`;
        const outputNode = {
          id: outputId,
          type: "output",
          position: { x: groupWidth + 200, y: groupHeight / 2 - 25 },
          data: { label: "Output", type: "output" },
        };
        subNodes.push(outputNode);

        externalOutgoing.forEach((edge) => {
          finalSubEdges.push({
            id: `e_${edge.source}-${outputId}`,
            source: edge.source,
            target: outputId,
            type: "default",
            animated: true,
          });
        });
      }

      try {
        // 5. Create Loop Flow via API
        const loopName = `Loop ${new Date().toLocaleTimeString()}`;
        const response = await projectManager.createFlow(
          activeProject.id,
          loopName,
          {
            type: "loop",
            parentId: activeFlowId,
            nodes: subNodes,
            edges: finalSubEdges,
          },
        );

        const newFlow = response?.flow || response;
        if (!newFlow || !newFlow.id)
          throw new Error("Failed to create loop flow");

        // REFRESH PROJECT DATA
        if (activeQueryClient) {
          if (response?.project) {
            activeQueryClient.setQueryData(
              ["project", activeProject.id],
              response.project,
            );
          } else {
            activeQueryClient.setQueryData(
              ["project", activeProject.id],
              (old) => {
                if (!old) return old;
                const flows = old.flows || [];
                if (flows.some((f) => f.id === newFlow.id)) return old;
                return {
                  ...old,
                  flows: [...flows, newFlow],
                };
              },
            );
          }
          activeQueryClient.invalidateQueries({
            queryKey: ["project", activeProject.id],
          });
        }

        // 6. Create The Loop Node in Main Flow
        const loopId = generateNodeId();
        const loopNode = {
          id: loopId,
          type: "loop",
          position: { x: minX, y: minY },
          width: groupWidth,
          height: groupHeight,
          data: {
            label: loopName,
            type: "loop",
            flowId: newFlow.id,
            configuration: { mode: "count", iterations: 1, flowId: newFlow.id },
            nodeCount: subNodes.length,
            hasInput: subNodes.some((n) => n.type === "input"),
            hasOutput: subNodes.some((n) => n.type === "output"),
            subFlow: { nodes: subNodes, edges: finalSubEdges },
          },
          style: getNodeStyle ? getNodeStyle(NODE_STATES.DEFAULT) : {},
        };

        // 7. Update Main Flow State
        const remainingNodes = nodesRef.current.filter(
          (n) => !selectedNodeIds.has(n.id),
        );

        const remainingEdges = edgesRef.current.filter(
          (e) =>
            !selectedNodeIds.has(e.source) &&
            !selectedNodeIds.has(e.target) &&
            !externalIncoming.includes(e) &&
            !externalOutgoing.includes(e),
        );

        const newIncomingEdges = externalIncoming.map((e) => ({
          ...e,
          id: `e_${e.source}-${loopId}_${e.target}_${e.targetHandle || "default"}`,
          target: loopId,
          targetHandle: null, // loop node doesn't have target handles
          data: {
            ...(e.data || {}),
            originalTarget: e.target,
            originalTargetHandle: e.targetHandle,
          },
        }));

        const newOutgoingEdges = externalOutgoing.map((e) => ({
          ...e,
          id: `e_${loopId}_${e.source}_${e.sourceHandle || "default"}-${e.target}`,
          source: loopId,
          sourceHandle: null, // loop node doesn't have source handles
          data: {
            ...(e.data || {}),
            originalSource: e.source,
            originalSourceHandle: e.sourceHandle,
          },
        }));

        const nextNodes = [...remainingNodes, loopNode];
        const nextEdges = sanitizeEdges(
          [...remainingEdges, ...newIncomingEdges, ...newOutgoingEdges],
          nextNodes,
        );

        // Synchronously update refs to prevent race condition during save
        nodesRef.current = nextNodes;
        edgesRef.current = nextEdges;

        setNodes(nextNodes);
        setEdges(nextEdges);

        if (saveFlowRef.current) {
          await saveFlowRef.current();
        }

        setTimeout(() => {
          setSelectedNodeId(loopId);
        }, 50);

        toastHook.success(
          tHook("groups.loop_success", "Iterated Selection Created"),
        );
      } catch (error) {
        console.error("Failed to loop nodes:", error);
        toastHook.error(
          tHook("groups.loop_error", "Failed to create iterate selection"),
        );
      }
    },
    [
      currentProject,
      currentFlowId,
      queryClient,
      saveToHistory,
      setNodes,
      setEdges,
      setSelectedNodeId,
      toastHook,
      tHook,
    ],
  );

  const detectOrphans = useCallback((nodesToTest, edgesToTest) => {
    const nds = nodesToTest || nodesRef.current;
    const eds = edgesToTest || edgesRef.current;
    if (!nds || nds.length === 0) return [];

    // Find all Entry Points (Roots)
    const roots = nds.filter((n) =>
      ["launch_browser", "input", "trigger"].includes(n.type || n.data?.type),
    );
    if (roots.length === 0) return [];

    const visited = new Set();
    const queue = [...roots.map((n) => n.id)];
    roots.forEach((n) => visited.add(n.id));

    // Build Adjacency Map
    const adj = {};
    eds.forEach((e) => {
      if (!adj[e.source]) adj[e.source] = [];
      adj[e.source].push(e.target);
    });

    // BFS
    while (queue.length > 0) {
      const current = queue.shift();
      const neighbors = adj[current] || [];
      neighbors.forEach((neighborId) => {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighborId);
        }
      });
    }

    // Orphans are nodes NOT visited
    return nds.filter((n) => !visited.has(n.id)).map((n) => n.id);
  }, []);

  const migrateNodes = useCallback(async (nodesToMigrate, projectId) => {
    const processedNodes = [...nodesToMigrate];

    for (let i = 0; i < processedNodes.length; i++) {
      const node = processedNodes[i];
      if (
        (node.type === "component" || node.data?.type === "component") &&
        node.data?.subFlow &&
        !node.data?.flowId
      ) {
        try {
          const flowName = node.data.label || "Sub Flow";
          const response = await projectManager.createFlow(projectId, flowName);
          const newFlowId = response.flow?.id || response.id;

          await projectManager.updateFlow(projectId, newFlowId, {
            nodes: node.data.subFlow.nodes || [],
            edges: node.data.subFlow.edges || [],
            viewport: node.data.subFlow.viewport || { x: 0, y: 0, zoom: 1 },
          });

          processedNodes[i] = {
            ...node,
            data: {
              ...node.data,
              flowId: newFlowId,
              configuration: {
                ...node.data?.configuration,
                flowId: newFlowId,
              },
              subFlow: undefined,
            },
          };
        } catch (err) {
          logger.error("Failed to migrate component node", err);
        }
      }
    }
    return processedNodes;
  }, []);

  const onLayout = useCallback(
    (direction, reactFlowFitView) => {
      saveToHistory();
      const [layoutedNodes, layoutedEdges] = getLayoutedElements(
        nodesRef.current,
        edgesRef.current,
        direction || "LR",
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      if (reactFlowFitView) {
        setTimeout(() => {
          reactFlowFitView({ duration: 800 });
        }, 50);
      }
    },
    [saveToHistory, setNodes, setEdges],
  );

  const toggleNodesDisabled = useCallback(
    (nodeIds, forcedState) => {
      saveToHistory();
      const idsToUpdate = Array.isArray(nodeIds) ? nodeIds : [nodeIds];

      setNodes((nds) => {
        const nextNodes = nds.map((node) => {
          if (idsToUpdate.includes(node.id)) {
            const isDisabled =
              forcedState !== undefined ? forcedState : !node.data?.disabled;
            return {
              ...node,
              data: { ...node.data, disabled: isDisabled },
            };
          }
          return node;
        });

        const disabledIds = new Set(
          nextNodes.filter((n) => n.data?.disabled).map((n) => n.id),
        );
        setEdges((eds) =>
          eds.map((edge) => {
            const isDimmed =
              disabledIds.has(edge.source) || disabledIds.has(edge.target);
            return {
              ...edge,
              style: isDimmed
                ? { opacity: 0.3, strokeDasharray: "5 5", stroke: "#64748b" }
                : { opacity: 1, strokeDasharray: "none", stroke: "#38bdf8" },
              animated: !isDimmed && edge.animated !== false,
            };
          }),
        );

        return nextNodes;
      });
    },
    [saveToHistory, setNodes, setEdges],
  );

  const toggleDownstreamDisabled = useCallback(
    (startNodeId, forcedState) => {
      const getSuccessors = (nodeId, allEdges) => {
        const successors = new Set();
        const stack = [nodeId];
        while (stack.length > 0) {
          const curr = stack.pop();
          allEdges
            .filter((e) => e.source === curr)
            .forEach((e) => {
              if (!successors.has(e.target)) {
                successors.add(e.target);
                stack.push(e.target);
              }
            });
        }
        return Array.from(successors);
      };

      const successorIds = getSuccessors(startNodeId, edgesRef.current);
      const allIds = [startNodeId, ...successorIds];

      toggleNodesDisabled(allIds, forcedState);
    },
    [toggleNodesDisabled],
  );

  const addGhostNode = useCallback(
    (type, selector, value) => {
      const id = generateNodeId();
      const label = NODE_LABELS[type] || type;

      const rightmostXP = nodesRef.current.reduce(
        (max, n) => Math.max(max, n.position.x),
        100,
      );
      const lastNodeAtY = nodesRef.current
        .filter((n) => n.position.x === rightmostXP)
        .reduce((max, n) => Math.max(max, n.position.y), 100);

      const newNode = {
        id,
        type,
        position: { x: rightmostXP + 300, y: lastNodeAtY },
        data: {
          label,
          type,
          configuration: { selector, text: value },
          isGhost: true,
          state: NODE_STATES.DEFAULT,
        },
        sourcePosition: "right",
        targetPosition: "left",
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes],
  );

  const replayRun = useCallback(
    (runData, toast) => {
      if (!runData || !runData.steps) return;

      if (runData.flow_snapshot) {
        try {
          const snapshot = JSON.parse(runData.flow_snapshot);
          if (snapshot.nodes && snapshot.edges) {
            // Normalize nodes/edges to use React Flow IDs (nodeId/edgeId) if they came from database representation
            const normalizedNodes = (snapshot.nodes || []).map((n) => ({
              ...n,
              id: n.nodeId || n.id,
              type: n.type || "default",
            }));
            const normalizedEdges = (snapshot.edges || []).map((e) => ({
              ...e,
              id: e.edgeId || e.id,
              type: e.type || "custom",
            }));
            setNodes(normalizedNodes);
            setEdges(normalizedEdges);
          }
        } catch (e) {
          console.error("Failed to parse flow snapshot", e);
        }
      }

      runData.steps.forEach((step) => {
        const stepNodeId = step.nodeId || step.node_id;
        updateNodeState(stepNodeId, step.status, { message: step.error });
      });

      if (toast) {
        toast.info(
          `Showing execution from ${new Date(runData.started_at).toLocaleTimeString()}`,
        );
      }
    },
    [updateNodeState, setNodes, setEdges],
  );

  const ungroupNodes = useCallback(
    async (componentNodeId) => {
      const componentNode = nodesRef.current.find(
        (n) => n.id === componentNodeId,
      );
      if (
        !componentNode ||
        (componentNode.data?.type !== "component" &&
          componentNode.data?.type !== "loop" &&
          componentNode.data?.type !== "for_each")
      ) {
        return;
      }

      saveToHistory();

      let subFlow = componentNode.data?.subFlow;
      const flowId = componentNode.data?.flowId;

      if (
        (!subFlow || !subFlow.nodes || subFlow.nodes.length === 0) &&
        flowId &&
        currentProject?.flows
      ) {
        const matchingFlow = currentProject.flows.find((f) => f.id === flowId);
        if (matchingFlow) {
          subFlow = {
            nodes: matchingFlow.nodes || [],
            edges: matchingFlow.edges || [],
          };
        }
      }

      if (!subFlow) {
        subFlow = { nodes: [], edges: [] };
      }

      const { nodes: subNodes = [], edges: subEdges = [] } = subFlow;

      const restoredNodes = subNodes
        .filter((n) => n.type !== "input" && n.type !== "output")
        .map((n) => ({
          ...n,
          position: {
            x: n.position.x + componentNode.position.x,
            y: n.position.y + componentNode.position.y,
          },
          selected: true,
        }));

      // Find boundary node IDs
      const inputNodeIds = new Set(
        subNodes.filter((n) => n.type === "input").map((n) => n.id),
      );
      const outputNodeIds = new Set(
        subNodes.filter((n) => n.type === "output").map((n) => n.id),
      );

      // Internal edges to restore
      const internalEdges = subEdges.filter(
        (e) =>
          !inputNodeIds.has(e.source) &&
          !inputNodeIds.has(e.target) &&
          !outputNodeIds.has(e.source) &&
          !outputNodeIds.has(e.target),
      );

      // Find current incoming/outgoing edges in the main flow
      const currentIncoming = edgesRef.current.filter(
        (e) => e.target === componentNodeId,
      );
      const currentOutgoing = edgesRef.current.filter(
        (e) => e.source === componentNodeId,
      );

      const restoredIncoming = [];
      const restoredOutgoing = [];

      // Reconnect incoming edges
      currentIncoming.forEach((incomingEdge) => {
        const originalTarget = incomingEdge.data?.originalTarget;
        const originalTargetHandle = incomingEdge.data?.originalTargetHandle;

        if (
          originalTarget &&
          restoredNodes.some((rn) => rn.id === originalTarget)
        ) {
          const restoredEdge = {
            ...incomingEdge,
            id: `e_${incomingEdge.source}-${originalTarget}`,
            target: originalTarget,
            targetHandle: originalTargetHandle,
          };
          if (restoredEdge.data) {
            const {
              originalTarget: _,
              originalTargetHandle: __,
              ...cleanedData
            } = restoredEdge.data;
            restoredEdge.data =
              Object.keys(cleanedData).length > 0 ? cleanedData : undefined;
          }
          restoredIncoming.push(restoredEdge);
        } else {
          // Fallback: connect to all nodes the input node connected to
          const inputNode = subNodes.find((n) => n.type === "input");
          if (inputNode) {
            const subIncomingEdges = subEdges.filter(
              (se) => se.source === inputNode.id,
            );
            subIncomingEdges.forEach((se) => {
              restoredIncoming.push({
                ...incomingEdge,
                id: `e_${incomingEdge.source}-${se.target}`,
                target: se.target,
                targetHandle: se.targetHandle,
              });
            });
          }
        }
      });

      // Reconnect outgoing edges
      currentOutgoing.forEach((outgoingEdge) => {
        const originalSource = outgoingEdge.data?.originalSource;
        const originalSourceHandle = outgoingEdge.data?.originalSourceHandle;

        if (
          originalSource &&
          restoredNodes.some((rn) => rn.id === originalSource)
        ) {
          const restoredEdge = {
            ...outgoingEdge,
            id: `e_${originalSource}-${outgoingEdge.target}`,
            source: originalSource,
            sourceHandle: originalSourceHandle,
          };
          if (restoredEdge.data) {
            const {
              originalSource: _,
              originalSourceHandle: __,
              ...cleanedData
            } = restoredEdge.data;
            restoredEdge.data =
              Object.keys(cleanedData).length > 0 ? cleanedData : undefined;
          }
          restoredOutgoing.push(restoredEdge);
        } else {
          // Fallback: connect from all nodes that connected to the output node
          const outputNode = subNodes.find((n) => n.type === "output");
          if (outputNode) {
            const subOutgoingEdges = subEdges.filter(
              (se) => se.target === outputNode.id,
            );
            subOutgoingEdges.forEach((se) => {
              restoredOutgoing.push({
                ...outgoingEdge,
                id: `e_${se.source}-${outgoingEdge.target}`,
                source: se.source,
                sourceHandle: se.sourceHandle,
              });
            });
          }
        }
      });

      const nextNodes = [
        ...nodesRef.current.filter((n) => n.id !== componentNodeId),
        ...restoredNodes,
      ];

      const nextEdges = sanitizeEdges(
        [
          ...edgesRef.current.filter(
            (e) => e.source !== componentNodeId && e.target !== componentNodeId,
          ),
          ...internalEdges,
          ...restoredIncoming,
          ...restoredOutgoing,
        ],
        nextNodes,
      );

      // Synchronously update refs to prevent race condition during save
      nodesRef.current = nextNodes;
      edgesRef.current = nextEdges;

      setNodes(nextNodes);
      setEdges(nextEdges);

      // Persist changes immediately
      setTimeout(async () => {
        if (saveFlowRef.current) {
          await saveFlowRef.current();
        }
      }, 50);
    },
    [saveToHistory, setNodes, setEdges, currentProject],
  );

  const updateNodeConfiguration = useCallback(
    async (nodeId, newConfig) => {
      setHasUnsavedChanges(true);
      saveToHistory();

      // Phase 5: Edge Reconciliation / Orphan Cleanup
      if (newConfig.cases || newConfig.branches) {
        setNodes((nds) => {
          const oldNode = nds.find((n) => n.id === nodeId);
          const oldCases = oldNode?.data?.configuration?.cases || [];
          const oldBranches = oldNode?.data?.configuration?.branches || [];

          if (newConfig.cases && Array.isArray(newConfig.cases)) {
            const newCaseIds = new Set(newConfig.cases.map((c) => c.id));
            const removedCaseIds = oldCases
              .map((c) => c.id)
              .filter((id) => !newCaseIds.has(id));

            if (removedCaseIds.length > 0) {
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    !(
                      e.source === nodeId &&
                      removedCaseIds.includes(e.sourceHandle)
                    ),
                ),
              );
            }
          }

          if (newConfig.branches && Array.isArray(newConfig.branches)) {
            const newBranchIds = new Set(newConfig.branches.map((b) => b.id));
            const removedBranchIds = oldBranches
              .map((b) => b.id)
              .filter((id) => !newBranchIds.has(id));

            if (removedBranchIds.length > 0) {
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    !(
                      e.source === nodeId &&
                      removedBranchIds.includes(e.sourceHandle)
                    ),
                ),
              );
            }
          }

          return updateNodeRecursively(nds, nodeId, (n) => {
            return {
              ...n,
              data: {
                ...n.data,
                configuration: {
                  ...n.data.configuration,
                  ...newConfig,
                },
                customLabel:
                  newConfig.customLabel !== undefined
                    ? newConfig.customLabel
                    : n.data.customLabel,
                label:
                  newConfig.label ||
                  n.data.label ||
                  NODE_LABELS[n.data.type] ||
                  n.data.type,
                description:
                  newConfig.description !== undefined
                    ? newConfig.description
                    : n.data.description,
              },
            };
          });
        });
      } else {
        setNodes((nds) =>
          updateNodeRecursively(nds, nodeId, (n) => {
            return {
              ...n,
              data: {
                ...n.data,
                configuration: {
                  ...n.data.configuration,
                  ...newConfig,
                },
                customLabel:
                  newConfig.customLabel !== undefined
                    ? newConfig.customLabel
                    : n.data.customLabel,
                label:
                  newConfig.label ||
                  n.data.label ||
                  NODE_LABELS[n.data.type] ||
                  n.data.type,
                description:
                  newConfig.description !== undefined
                    ? newConfig.description
                    : n.data.description,
              },
            };
          }),
        );
      }
    },
    [saveToHistory, setNodes, setEdges],
  );

  const copyElements = useCallback(() => {
    const selectedNodes = nodesRef.current.filter((n) => n.selected);
    const selectedEdges = edgesRef.current.filter((e) => e.selected);

    if (selectedNodes.length === 0 && selectedEdges.length === 0) return 0;

    setClipboard({
      nodes: JSON.parse(JSON.stringify(selectedNodes)),
      edges: JSON.parse(JSON.stringify(selectedEdges)),
    });

    return selectedNodes.length + selectedEdges.length;
  }, []);

  const cutElements = useCallback(() => {
    const selectedNodes = nodesRef.current.filter((n) => n.selected);
    const selectedEdges = edgesRef.current.filter((e) => e.selected);

    if (selectedNodes.length === 0 && selectedEdges.length === 0) return 0;

    setClipboard({
      nodes: JSON.parse(JSON.stringify(selectedNodes)),
      edges: JSON.parse(JSON.stringify(selectedEdges)),
    });

    saveToHistory();
    const nodeIdsToRemove = new Set(selectedNodes.map((n) => n.id));
    const edgeIdsToRemove = new Set(selectedEdges.map((e) => e.id));

    setNodes((nds) => nds.filter((n) => !nodeIdsToRemove.has(n.id)));
    setEdges((eds) =>
      eds.filter(
        (e) =>
          !edgeIdsToRemove.has(e.id) &&
          !nodeIdsToRemove.has(e.source) &&
          !nodeIdsToRemove.has(e.target),
      ),
    );

    setHasUnsavedChanges(true);
    return selectedNodes.length + selectedEdges.length;
  }, [saveToHistory, setNodes, setEdges]);

  const pasteElements = useCallback(() => {
    if (clipboard.nodes.length === 0 && clipboard.edges.length === 0) return 0;

    saveToHistory();

    const idMapping = {};
    const newNodes = clipboard.nodes.map((node) => {
      const newId = generateNodeId();
      idMapping[node.id] = newId;

      return {
        ...node,
        id: newId,
        selected: true,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
      };
    });

    const newEdges = clipboard.edges
      .map((edge) => {
        const newSource = idMapping[edge.source];
        const newTarget = idMapping[edge.target];

        if (newSource && newTarget) {
          return {
            ...edge,
            id: `edge-${newSource}-${newTarget}`,
            source: newSource,
            target: newTarget,
            selected: true,
          };
        }
        return null;
      })
      .filter(Boolean);

    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
    setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));

    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);

    setHasUnsavedChanges(true);
    return newNodes.length + newEdges.length;
  }, [clipboard, saveToHistory, setNodes, setEdges]);

  const duplicateElements = useCallback(() => {
    const selectedNodes = nodesRef.current.filter((n) => n.selected);
    const selectedEdges = edgesRef.current.filter((e) => e.selected);

    if (selectedNodes.length === 0) return 0;

    saveToHistory();

    const idMapping = {};
    const newNodes = selectedNodes.map((node) => {
      const newId = generateNodeId();
      idMapping[node.id] = newId;

      return {
        ...node,
        id: newId,
        selected: true,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        data: {
          ...node.data,
          label: `${node.data.label} (copy)`,
        },
      };
    });

    const newEdges = selectedEdges
      .map((edge) => {
        const newSource = idMapping[edge.source];
        const newTarget = idMapping[edge.target];

        if (newSource && newTarget) {
          return {
            ...edge,
            id: `edge-${newSource}-${newTarget}`,
            source: newSource,
            target: newTarget,
            selected: true,
          };
        }
        return null;
      })
      .filter(Boolean);

    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
    setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));

    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);

    setHasUnsavedChanges(true);
    return newNodes.length + newEdges.length;
  }, [saveToHistory, setNodes, setEdges]);

  const designTimeContext = useMemo(() => {
    return calculateDesignTimeContext(nodes, edges);
  }, [nodes, edges]);

  const simulatedResults = useMemo(() => ({}), []);

  return {
    nodes,
    edges,
    nodesRef,
    edgesRef,
    setNodes,
    setEdges,
    selectedNodeId,
    setSelectedNodeId,
    selectedAction: useMemo(() => {
      if (!selectedNodeId) return null;
      const node = nodes.find((n) => n.id === selectedNodeId);
      if (!node) return null;
      return { ...node, nodeId: node.id };
    }, [selectedNodeId, nodes]),
    history,
    saveToHistory,
    undo,
    redo,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    addNode,
    deleteNode,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clipboard,
    copyElements,
    cutElements,
    pasteElements,
    duplicateElements,
    updateNodeConfiguration,
    updateNodeState,
    groupNodes,
    loopNodes,
    ungroupNodes,
    migrateNodes,
    onLayout,
    addGhostNode,
    toggleNodesDisabled,
    toggleDownstreamDisabled,
    replayRun,
    clearFlow,
    detectOrphans,
    designTimeContext,
    simulatedResults,
    setSaveFlow,
  };
}
