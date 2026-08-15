import { useState, useCallback, useRef } from "react";
import { useToast } from "./useToast";
import { useTranslation } from "react-i18next";
import { api } from "../utils/api";
import { NODE_STATES } from "../components/hooks/flowStyles";

export const useElementPicker = ({
  selectedAction,
  updateNodeState,
  updateNodeConfiguration,
  activeBrowserId,
  setActiveBrowserId,
  nodes,
  edges,
  executeFlow,
  setNodes,
}) => {
  const toast = useToast();
  const { t } = useTranslation();
  const [pickingField, setPickingField] = useState("selector");
  const lastPickIdRef = useRef(null);
  const lastPickedTargetRef = useRef(null);

  const setNestedValue = useCallback((obj, path, value) => {
    const keys = path.split(".");
    const lastKey = keys.pop();
    const newObj = JSON.parse(JSON.stringify(obj || {}));
    let current = newObj;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!current[key]) current[key] = isNaN(Number(keys[i + 1])) ? {} : [];
      current = current[key];
    }
    current[lastKey] = value;
    return newObj;
  }, []);

  const handleCancelPicking = useCallback(async () => {
    if (selectedAction) {
      updateNodeState(selectedAction.nodeId, NODE_STATES.DEFAULT, {
        pickingField: null,
      });
    }

    setPickingField("selector");
    lastPickIdRef.current = null;
    lastPickedTargetRef.current = null;

    try {
      await api.post("/inspector/stop", { browserId: activeBrowserId || null });
    } catch (e) {
      console.warn("[useElementPicker] Failed to stop backend inspector:", e);
    }
  }, [selectedAction, updateNodeState, activeBrowserId]);

  const handleStartPicking = useCallback(
    async (fieldKey = "selector") => {
      if (selectedAction?.data?.state === NODE_STATES.PICKING) {
        console.log(
          "[useElementPicker] 🛑 Already picking, stopping current session...",
        );
        await handleCancelPicking();
        return;
      }

      if (!selectedAction) return;

      console.log("[useElementPicker] 📍 Starting picker for field:", fieldKey);
      setPickingField(fieldKey);

      updateNodeState(selectedAction.nodeId, NODE_STATES.PICKING, {
        pickingField: fieldKey,
      });
      toast.info(
        t("common.inspector_started", "Pick an element in the browser..."),
      );

      const isRemote = window.location.hostname !== "localhost";

      let inspectorBrowserId = activeBrowserId;
      if (!inspectorBrowserId) {
        try {
          const sessionRes = await api.get("/inspector/sessions");
          if (sessionRes.success && sessionRes.sessions?.length > 0) {
            inspectorBrowserId = sessionRes.sessions[0];
            console.log(
              "[useElementPicker] 🔍 Auto-detected active backend browser session:",
              inspectorBrowserId,
            );
            if (setActiveBrowserId) {
              setActiveBrowserId(inspectorBrowserId);
            }
          }
        } catch (sessionErr) {
          console.warn(
            "[useElementPicker] Failed to fetch active sessions from backend:",
            sessionErr,
          );
        }
      }

      let needsLaunch = isRemote || !inspectorBrowserId;

      const getStartingUrl = () => {
        const openUrlNode = nodes.find(
          (n) => n.type === "open_url" || n.data?.type === "open_url",
        );
        return (
          openUrlNode?.data?.configuration?.url || "https://www.google.com"
        );
      };

      try {
        if (!needsLaunch) {
          console.log(
            "[useElementPicker] 🚀 Starting local inspector on browserId:",
            inspectorBrowserId,
          );
          try {
            const data = await api.post("/inspector/start", {
              browserId: inspectorBrowserId,
              url: getStartingUrl(),
            });
            if (!data.success) {
              if (
                data.code === "BROWSER_DISCONNECTED" ||
                data.message?.includes("dead") ||
                data.message?.includes("not found") ||
                data.message?.includes("No active browser")
              ) {
                inspectorBrowserId = null;
                needsLaunch = true;
              } else {
                throw new Error(data.message);
              }
            }
          } catch (err) {
            const errCode = err?.response?.data?.code;
            const errMsg = err?.response?.data?.message || err.message || "";
            const errStatus = err?.response?.status;

            if (
              errCode === "BROWSER_DISCONNECTED" ||
              errStatus === 404 ||
              errMsg.includes("dead") ||
              errMsg.includes("not found") ||
              errMsg.includes("No active browser") ||
              errMsg.includes("404")
            ) {
              inspectorBrowserId = null;
              needsLaunch = true;
            } else {
              throw err;
            }
          }
        }

        if (!inspectorBrowserId) {
          console.log(
            "[useElementPicker] 🌐 Needs browser state for picker...",
          );

          const getAncestors = (nodeId, graphNodes, graphEdges) => {
            const ancestors = [];
            const visited = new Set();
            const queue = [nodeId];

            while (queue.length > 0) {
              const currentId = queue.shift();
              if (visited.has(currentId)) continue;
              visited.add(currentId);

              const incomingEdges = graphEdges.filter(
                (e) => e.target === currentId,
              );
              for (const edge of incomingEdges) {
                if (!visited.has(edge.source)) {
                  const sourceNode = graphNodes.find(
                    (n) => n.id === edge.source,
                  );
                  if (sourceNode) ancestors.push(sourceNode);
                  queue.push(edge.source);
                }
              }
            }
            return ancestors;
          };

          const ancestors = getAncestors(selectedAction.nodeId, nodes, edges);

          if (ancestors.length > 0) {
            console.log(
              "[useElementPicker] 🔄 Executing ancestor nodes:",
              ancestors.length,
            );
            const toastId = toast.loading(
              t("common.picker_setup", "Executing previous steps..."),
            );

            try {
              const execResult = await executeFlow({
                nodes: ancestors,
                keepOpen: true,
              });
              toast.dismiss(toastId);

              if (execResult && execResult.success && execResult.browserId) {
                inspectorBrowserId = execResult.browserId;
              }
            } catch (err) {
              toast.dismiss(toastId);
              console.warn("[useElementPicker] ⚠ Error building state:", err);
            }
          }
        }

        if (inspectorBrowserId) {
          const data = await api.post("/inspector/start", {
            browserId: inspectorBrowserId,
            url: getStartingUrl(),
          });
          if (!data.success) throw new Error(data.message);
        } else {
          const res = await api.post("/inspector/launch-remote", {
            url: getStartingUrl(),
          });
          if (!res.success) throw new Error(res.message);
        }
      } catch (error) {
        console.error("[useElementPicker] Picker Start Error:", error);
        toast.error(error.message || "Failed to start inspector");
        if (selectedAction)
          updateNodeState(selectedAction.nodeId, NODE_STATES.DEFAULT);
      }
    },
    [
      selectedAction,
      updateNodeState,
      toast,
      t,
      activeBrowserId,
      setActiveBrowserId,
      nodes,
      edges,
      executeFlow,
      handleCancelPicking,
    ],
  );

  const pickBestSelector = useCallback((data) => {
    const sources = data.candidates || data.selectors || {};

    const preferredOrder = [
      "playwrightTestId",
      "playwrightRole",
      "playwrightLabel",
      "playwrightText",
      "testId",
      "id",
      "name",
      "aria",
      "text",
      "cssPath",
    ];

    for (const type of preferredOrder) {
      const candidate = sources[type];
      if (candidate) return candidate;
    }

    const fallbackMap = {
      dataAttribute: sources.dataAttribute,
      testId: sources.testId,
      css: sources.css || sources.cssPath,
      xpath: sources.xpath || sources.text,
    };

    for (const candidate of Object.values(fallbackMap)) {
      if (candidate) return candidate;
    }

    return data.selector || data.sanitizedSelector || "";
  }, []);

  const handleElementPicked = useCallback(
    async (data) => {
      console.log("[useElementPicker] 🎯 Element Picked Event Received:", data);

      const pickId = data.pickId;
      if (!pickId) {
        console.warn("[useElementPicker] Missing pickId on element_picked event");
        return;
      }
      lastPickIdRef.current = pickId;
      lastPickedTargetRef.current = {
        nodeId: selectedAction?.nodeId,
        field: pickingField,
      };

      try {
        const finalSelector = pickBestSelector(data);

        if (
          !finalSelector ||
          typeof finalSelector !== "string" ||
          finalSelector.trim() === ""
        ) {
          toast.error(t("common.selector_empty"));
          nodes.forEach((n) => {
            if (n.data?.state === NODE_STATES.PICKING)
              updateNodeState(n.id, NODE_STATES.DEFAULT);
          });
          return;
        }

        const trimmedSelector = finalSelector.trim();
        let updatedAny = false;

        setNodes((currNodes) => {
          const pickingNodes = currNodes.filter(
            (n) => n.data?.state === NODE_STATES.PICKING,
          );

          if (pickingNodes.length === 0) return currNodes;

          updatedAny = true;
          return currNodes.map((node) => {
            if (node.data?.state === NODE_STATES.PICKING) {
              return {
                ...node,
                data: {
                  ...node.data,
                  state: NODE_STATES.DEFAULT,
                  configuration: setNestedValue(
                    node.data.configuration,
                    pickingField,
                    trimmedSelector,
                  ),
                  selectorMeta: {
                    candidates: data.candidates || {},
                    selectorType: data.selectorType || data.strategy || "unknown",
                    semanticContext: data.semanticContext || null,
                    aiOptimized: data.aiOptimized || false,
                    capturedAt: data.timestamp || new Date().toISOString(),
                  },
                },
              };
            }
            return node;
          });
        });

        if (updatedAny) {
          toast.success(t("common.selector_captured"));
        } else if (selectedAction) {
          await updateNodeConfiguration(
            selectedAction.nodeId,
            setNestedValue(
              selectedAction.data.configuration,
              pickingField,
              trimmedSelector,
            ),
          );
          updateNodeState(selectedAction.nodeId, NODE_STATES.DEFAULT);
          toast.success(t("common.selector_captured"));
        }

        await handleCancelPicking();
      } catch (err) {
        console.error(
          "[useElementPicker] Error processing picked element:",
          err,
        );
        toast.error("Error processing selection");
      }
    },
    [
      nodes,
      pickingField,
      updateNodeConfiguration,
      updateNodeState,
      handleCancelPicking,
      selectedAction,
      setNodes,
      setNestedValue,
      pickBestSelector,
      t,
      toast,
    ],
  );

  const handleElementSanitized = useCallback(
    async (data) => {
      console.log(
        "[useElementPicker] ✨ Element Sanitized Event Received:",
        data,
      );

      const pickId = data.pickId;
      if (!pickId || pickId !== lastPickIdRef.current) {
        console.warn(
          "[useElementPicker] Stale or mismatched sanitized event, ignoring.",
          { expected: lastPickIdRef.current, received: pickId },
        );
        return;
      }

      const target = lastPickedTargetRef.current;
      if (!target) {
        console.warn("[useElementPicker] No picked target to sanitize");
        return;
      }

      const sanitizedSelector = data.selector;
      if (!sanitizedSelector) return;

      try {
        setNodes((currNodes) => {
          return currNodes.map((node) => {
            if (node.id !== target.nodeId) return node;

            const currentConfig = node.data?.configuration || {};
            const updatedConfig = setNestedValue(
              currentConfig,
              target.field,
              sanitizedSelector,
            );

            const currentMeta = node.data?.selectorMeta || {};
            const updatedMeta = {
              ...currentMeta,
              aiOptimized: true,
              confidence: data.confidence,
              reasoning: data.reasoning,
              originalSelector: data.originalSelector || currentMeta.originalSelector,
              sanitizedSelector,
            };

            return {
              ...node,
              data: {
                ...node.data,
                configuration: updatedConfig,
                selectorMeta: updatedMeta,
              },
            };
          });
        });

        toast.success(
          t("common.selector_ai_optimized", "Selector optimized by AI") +
            ` (${Math.round((data.confidence || 0) * 100)}% confidence)`,
        );
      } catch (err) {
        console.error(
          "[useElementPicker] Error applying sanitized selector:",
          err,
        );
      }
    },
    [setNodes, setNestedValue, toast, t],
  );

  return {
    pickingField,
    handleStartPicking,
    handleCancelPicking,
    handleElementPicked,
    handleElementSanitized,
  };
};
