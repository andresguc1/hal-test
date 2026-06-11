import { useMemo, useState, useEffect, useCallback } from "react";
import { NODE_OUTPUTS } from "@/config/nodeConstants";
import { api } from "../utils/api";

/**
 * Custom hook to calculate all available variables upstream from the active node,
 * combined with global variables and backend state, with full property drilling.
 */
export function useAvailableVariables({
  activeNodeId,
  nodes = [],
  edges = [],
  liveVariables = {},
  simulatedResults = {},
}) {
  const [globalVariables, setGlobalVariables] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch variables from backend
  const fetchGlobalVariables = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/variables");
      if (res && res.success && res.data) {
        setGlobalVariables(res.data.global || {});
      }
    } catch (err) {
      console.warn("Failed to fetch global variables from backend:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll or fetch on mount/activeNode change
  useEffect(() => {
    fetchGlobalVariables();
  }, [fetchGlobalVariables, activeNodeId]);

  // 1. Recursive Upstream Predecessors Retrieval
  const precedingNodes = useMemo(() => {
    if (!activeNodeId || !nodes.length || !edges.length) return [];

    const predecessors = [];
    const visited = new Set();
    const queue = [activeNodeId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      // Find edges pointing into the current node
      const incoming = edges.filter((e) => e.target === currentId);
      for (const edge of incoming) {
        if (!visited.has(edge.source)) {
          visited.add(edge.source);
          const sourceNode = nodes.find((n) => n.id === edge.source);
          if (sourceNode) {
            predecessors.push(sourceNode);
            queue.push(edge.source);
          }
        }
      }
    }

    return predecessors;
  }, [activeNodeId, nodes, edges]);

  // 2. Compute variables list
  const availableVariables = useMemo(() => {
    const list = [];

    // --- A. Upstream Node Outputs ---
    precedingNodes.forEach((node) => {
      const nodeLabel = node.data?.customLabel || node.data?.label || node.id;
      const cleanLabel = nodeLabel.trim();
      const nodeType = node.data?.type || node.type;

      // Resolve node result value
      let resultValue = null;
      let source = "static";

      const liveResult =
        liveVariables[`${cleanLabel}.result`] ||
        liveVariables[`${node.id}.result`];

      if (liveResult !== undefined) {
        resultValue = liveResult;
        source = "live";
      } else if (node.data?.result !== undefined) {
        resultValue = node.data.result;
        source = "persisted";
      } else if (simulatedResults[node.id] !== undefined) {
        resultValue = simulatedResults[node.id];
        source = "simulated";
      } else {
        // Fallback to static schema
        const schema = NODE_OUTPUTS[nodeType];
        if (schema) {
          const mockObj = {};
          Object.entries(schema).forEach(([key, valType]) => {
            mockObj[key] = `<${valType}>`;
          });
          resultValue = mockObj;
          source = "static";
        }
      }

      // Add node level variables recursively
      const addVariablePath = (obj, prefix = "") => {
        if (!obj || typeof obj !== "object") return;

        Object.entries(obj).forEach(([key, val]) => {
          if (key.startsWith("_")) return; // Skip internal properties

          const relativePath = prefix ? `${prefix}.${key}` : key;
          let valueType = typeof val;
          if (
            source === "static" &&
            typeof val === "string" &&
            val.startsWith("<") &&
            val.endsWith(">")
          ) {
            valueType = val.slice(1, -1);
          }

          // Double referencing paths: both "NodeLabel.result.key" and "NodeLabel.key"
          const resultPath = `{{${cleanLabel}.result.${relativePath}}}`;
          const directPath = `{{${cleanLabel}.${relativePath}}}`;

          list.push({
            name: `${cleanLabel}.result.${relativePath}`,
            path: resultPath,
            type: valueType,
            scope: "local",
            source,
            value: val,
            nodeLabel: cleanLabel,
            description: `Output of step "${cleanLabel}" (${nodeType})`,
          });

          list.push({
            name: `${cleanLabel}.${relativePath}`,
            path: directPath,
            type: valueType,
            scope: "local",
            source,
            value: val,
            nodeLabel: cleanLabel,
            description: `Direct alias for output property of "${cleanLabel}"`,
          });

          // Drill down into nested objects (excluding arrays)
          if (val && typeof val === "object" && !Array.isArray(val)) {
            addVariablePath(val, relativePath);
          }
        });
      };

      if (resultValue && typeof resultValue === "object") {
        addVariablePath(resultValue);
      } else if (resultValue !== null && resultValue !== undefined) {
        // Direct value variable (e.g. string or number)
        list.push({
          name: `${cleanLabel}.result`,
          path: `{{${cleanLabel}.result}}`,
          type: typeof resultValue,
          scope: "local",
          source,
          value: resultValue,
          nodeLabel: cleanLabel,
          description: `Full output of step "${cleanLabel}"`,
        });

        list.push({
          name: cleanLabel,
          path: `{{${cleanLabel}}}`,
          type: typeof resultValue,
          scope: "local",
          source,
          value: resultValue,
          nodeLabel: cleanLabel,
          description: `Direct reference to step "${cleanLabel}"`,
        });
      }

      // Support custom variables declared by variable nodes or saveToVariable actions
      const config = node.data?.configuration;
      const isVarNode = nodeType === "variable";
      const customName = isVarNode
        ? (config?.name || config?.variableName || node.data?.name)
        : (config?.variableName || config?.saveToVariable);

      if (customName && typeof customName === "string" && customName.trim()) {
        const trimmedName = customName.trim();
        let customValue = isVarNode ? (config?.value ?? config?.initialValue ?? node.data?.value ?? "") : resultValue;
        let customSource = source;

        if (liveVariables[trimmedName] !== undefined) {
          customValue = liveVariables[trimmedName];
          customSource = "live";
        } else if (node.data?.result !== undefined) {
          customValue = node.data.result;
          customSource = "persisted";
        }

        list.push({
          name: trimmedName,
          path: `{{${trimmedName}}}`,
          type: typeof customValue,
          scope: "local",
          source: customSource,
          value: customValue,
          nodeLabel: cleanLabel,
          description: isVarNode
            ? `Variable "${trimmedName}" declared by node "${cleanLabel}"`
            : `Output of node "${cleanLabel}" saved to variable "${trimmedName}"`,
        });
      }
    });

    // --- B. Global Variables ---
    Object.entries(globalVariables).forEach(([name, value]) => {
      const type = typeof value;
      list.push({
        name,
        path: `{{${name}}}`,
        type,
        scope: "global",
        source: "backend",
        value,
        nodeLabel: "Global",
        description: "Shared global system variable",
      });
    });

    // --- C. Built-in Environment / Runtime Variables ---
    const envVars = {
      HAL_RUN_ID: "Unique identifier for the current run",
      HAL_BROWSER_CONNECTED:
        "Boolean status of active Playwright browser connection",
      HAL_LAST_ERROR:
        "Details of the most recently encountered execution error",
    };

    Object.entries(envVars).forEach(([name, desc]) => {
      list.push({
        name,
        path: `{{${name}}}`,
        type: "string",
        scope: "system",
        source: "runtime",
        value: "SYSTEM_VAR",
        nodeLabel: "System",
        description: desc,
      });
    });

    return list;
  }, [precedingNodes, liveVariables, simulatedResults, globalVariables]);

  // Group variables by nodeLabel/source for grouped dropdowns
  const groupedVariables = useMemo(() => {
    const groups = {};
    availableVariables.forEach((v) => {
      const groupName = v.nodeLabel;
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(v);
    });
    return groups;
  }, [availableVariables]);

  return {
    availableVariables,
    groupedVariables,
    precedingNodes,
    refetch: fetchGlobalVariables,
    loading,
  };
}
