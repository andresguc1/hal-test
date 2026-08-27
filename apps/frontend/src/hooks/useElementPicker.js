import { useState, useCallback, useRef } from "react";
import { useToast } from "./useToast";
import { useTranslation } from "react-i18next";
import { api } from "../utils/api";
import { NODE_STATES } from "../components/hooks/flowStyles";
import { usePickerReplay } from "./usePickerReplay";

export const useElementPicker = ({
  selectedAction,
  updateNodeState,
  _updateNodeConfiguration,
  activeBrowserId,
  setActiveBrowserId,
  nodes,
  edges,
  setNodes,
}) => {
  const toast = useToast();
  const { t } = useTranslation();
  const [pickingField, setPickingField] = useState("selector");
  const lastPickIdRef = useRef(null);
  const activePickSession = useRef(null);

  const { executeToNode, isReplaying, replayProgress } = usePickerReplay({
    nodes,
    edges,
    activeBrowserId,
    setActiveBrowserId,
    updateNodeState,
  });

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
    const targetNodeId =
      activePickSession.current?.nodeId || selectedAction?.nodeId;
    if (targetNodeId) {
      updateNodeState(targetNodeId, NODE_STATES.DEFAULT, {
        pickingField: null,
      });
    }

    setPickingField("selector");
    lastPickIdRef.current = null;
    activePickSession.current = null;

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
          "[useElementPicker] Already picking, stopping current session...",
        );
        await handleCancelPicking();
        return;
      }

      if (!selectedAction) return;

      console.log("[useElementPicker] Starting picker for field:", fieldKey);
      setPickingField(fieldKey);

      activePickSession.current = {
        nodeId: selectedAction.nodeId,
        field: fieldKey,
        pickId: null,
      };

      updateNodeState(selectedAction.nodeId, NODE_STATES.PICKING, {
        pickingField: fieldKey,
      });

      const isRemote = window.location.hostname !== "localhost";

      let inspectorBrowserId = activeBrowserId;
      if (!inspectorBrowserId) {
        try {
          const sessionRes = await api.get("/inspector/sessions");
          if (sessionRes.success && sessionRes.sessions?.length > 0) {
            inspectorBrowserId = sessionRes.sessions[0];
            console.log(
              "[useElementPicker] Auto-detected active backend browser session:",
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
            "[useElementPicker] Starting local inspector on browserId:",
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
            "[useElementPicker] Replaying previous steps to reach target node...",
          );

          const toastId = toast.loading(
            t(
              "common.picker_replay",
              "Preparing page... replaying previous steps",
            ),
          );

          const replayResult = await executeToNode(selectedAction.nodeId);
          toast.dismiss(toastId);

          if (replayResult.error) {
            const err = replayResult.error;
            toast.error(
              t(
                "common.picker_replay_failed",
                "Could not reach target node: failed at step {{step}} — {{label}}",
              )
                .replace("{{step}}", err.failedAtStep)
                .replace("{{label}}", err.nodeLabel) ||
                `Failed at: ${err.nodeLabel} — ${err.message}`,
            );

            if (replayResult.browserId) {
              inspectorBrowserId = replayResult.browserId;
            } else {
              updateNodeState(selectedAction.nodeId, NODE_STATES.DEFAULT);
              activePickSession.current = null;
              return;
            }
          } else if (replayResult.browserId) {
            inspectorBrowserId = replayResult.browserId;
          } else if (!replayResult.skipped) {
            console.warn(
              "[useElementPicker] Replay completed but no browserId returned",
            );
          }
        }

        if (inspectorBrowserId) {
          const data = await api.post("/inspector/start", {
            browserId: inspectorBrowserId,
            url: getStartingUrl(),
          });
          if (!data.success) throw new Error(data.message);

          toast.info(
            t("common.inspector_started", "Pick an element on the page..."),
          );
        } else {
          const res = await api.post("/inspector/launch-remote", {
            url: getStartingUrl(),
          });
          if (!res.success) throw new Error(res.message);

          toast.info(
            t("common.inspector_started", "Pick an element on the page..."),
          );
        }
      } catch (error) {
        console.error("[useElementPicker] Picker Start Error:", error);
        toast.error(error.message || "Failed to start inspector");
        if (selectedAction)
          updateNodeState(selectedAction.nodeId, NODE_STATES.DEFAULT);
        activePickSession.current = null;
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
      handleCancelPicking,
      executeToNode,
    ],
  );

  const pickBestSelector = useCallback((data) => {
    const sources = data.candidates || data.selectors || {};

    const preferredOrder = [
      "playwrightTestId",
      "playwrightRole",
      "playwrightLabel",
      "playwrightPlaceholder",
      "playwrightAltText",
      "playwrightTitle",
      "playwrightText",
      "testId",
      "id",
      "name",
      "aria",
      "text",
      "cssPath",
      "xpath",
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
      console.log("[useElementPicker] Element Picked Event Received:", data);

      const pickId = data.pickId;
      if (!pickId) {
        console.warn(
          "[useElementPicker] Missing pickId on element_picked event",
        );
        return;
      }

      if (!activePickSession.current) {
        console.warn(
          "[useElementPicker] No active pick session for element_picked",
        );
        return;
      }

      activePickSession.current.pickId = pickId;
      const targetNodeId = activePickSession.current.nodeId;
      const targetField = activePickSession.current.field;

      lastPickIdRef.current = pickId;

      try {
        const finalSelector = pickBestSelector(data);

        if (
          !finalSelector ||
          typeof finalSelector !== "string" ||
          finalSelector.trim() === ""
        ) {
          toast.error(t("common.selector_empty"));
          updateNodeState(targetNodeId, NODE_STATES.DEFAULT, {
            pickingField: null,
          });
          activePickSession.current = null;
          setPickingField("selector");
          return;
        }

        const trimmedSelector = finalSelector.trim();

        let matchWarning = null;
        if (
          !data.ambiguous &&
          activeBrowserId &&
          !trimmedSelector.startsWith("getBy")
        ) {
          try {
            const matchResult = await api.post("/inspector/count-matches", {
              browserId: activeBrowserId,
              selector: trimmedSelector,
            });
            if (matchResult.data?.warning) {
              matchWarning = matchResult.data.warning;
            }
          } catch (matchErr) {
            console.warn(
              "[useElementPicker] Failed to validate selector uniqueness:",
              matchErr,
            );
          }
        }

        setNodes((currNodes) => {
          return currNodes.map((node) => {
            if (node.id !== targetNodeId) return node;

            return {
              ...node,
              data: {
                ...node.data,
                state: NODE_STATES.DEFAULT,
                configuration: setNestedValue(
                  node.data.configuration,
                  targetField,
                  trimmedSelector,
                ),
                selectorMeta: {
                  candidates: data.candidates || {},
                  selectorType: data.selectorType || data.strategy || "unknown",
                  semanticContext: data.semanticContext || null,
                  aiOptimized: data.aiOptimized || false,
                  capturedAt: data.timestamp || new Date().toISOString(),
                  originalSelector: trimmedSelector,
                  ambiguous: data.ambiguous || false,
                  cardinality: data.cardinality || false,
                  contextChain: data.contextChain || null,
                },
              },
            };
          });
        });

        toast.success(t("common.selector_captured"));

        if (matchWarning) {
          toast.warning(
            t("common.selector_ambiguous_warning", matchWarning),
          );
        } else if (data.ambiguous) {
          toast.warning(
            t(
              "common.selector_ambiguous_pick",
              "⚠ Multiple elements match this selector. Consider using context or a unique attribute.",
            ),
          );
        }
      } catch (err) {
        console.error(
          "[useElementPicker] Error processing picked element:",
          err,
        );
        toast.error("Error processing selection");
      } finally {
        await handleCancelPicking();
      }
    },
    [
      updateNodeState,
      handleCancelPicking,
      setNodes,
      setNestedValue,
      pickBestSelector,
      t,
      toast,
    ],
  );

  const handleElementSanitized = useCallback(
    async (data) => {
      console.log("[useElementPicker] Element Sanitized Event Received:", data);

      const pickId = data.pickId;
      if (
        !pickId ||
        !activePickSession.current ||
        pickId !== activePickSession.current.pickId
      ) {
        console.warn(
          "[useElementPicker] Stale or mismatched sanitized event, ignoring.",
          { expected: activePickSession.current?.pickId, received: pickId },
        );
        return;
      }

      const targetNodeId = activePickSession.current.nodeId;
      const targetField = activePickSession.current.field;

      const sanitizedSelector = data.selector;
      if (!sanitizedSelector) return;

      try {
        setNodes((currNodes) => {
          return currNodes.map((node) => {
            if (node.id !== targetNodeId) return node;

            const currentConfig = node.data?.configuration || {};
            const currentSelector = currentConfig[targetField];
            const meta = node.data?.selectorMeta || {};
            const originalSelector = meta.originalSelector;

            if (
              originalSelector !== undefined &&
              currentSelector !== originalSelector
            ) {
              console.log(
                "[useElementPicker] Manual edit detected on selector, preserving user modification.",
              );
              toast.info(
                t(
                  "common.selector_ai_skipped",
                  "AI optimization skipped: selector was manually edited",
                ),
              );
              return node;
            }

            const updatedConfig = setNestedValue(
              currentConfig,
              targetField,
              sanitizedSelector,
            );

            const updatedMeta = {
              ...meta,
              aiOptimized: true,
              confidence: data.confidence,
              reasoning: data.reasoning,
              originalSelector: meta.originalSelector || data.originalSelector,
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
    isReplaying,
    replayProgress,
  };
};
