import { useState, useCallback } from "react";
import { useToast } from "./useToast";
import { useTranslation } from "react-i18next";
import { api } from "../utils/api";
import { NODE_STATES } from "../components/hooks/flowStyles";

/**
 * Hook para gestionar la lógica de selección de elementos (Picker/Inspector)
 */
export const useElementPicker = ({
  selectedAction,
  updateNodeState,
  updateNodeConfiguration,
  activeBrowserId,
  nodes,
  edges,
  executeFlow,
  setNodes,
}) => {
  const toast = useToast();
  const { t } = useTranslation();
  const [pickingField, setPickingField] = useState("selector");

  // CANCEL PICKING HANDLER
  const handleCancelPicking = useCallback(async () => {
    if (selectedAction) {
      updateNodeState(selectedAction.nodeId, NODE_STATES.DEFAULT, {
        pickingField: null,
      });
      console.log(
        "[useElementPicker] Resetting node state to DEFAULT for node:",
        selectedAction.nodeId,
      );
    }

    setPickingField("selector");

    try {
      await api.post("/inspector/stop", { browserId: activeBrowserId || null });
    } catch (e) {
      console.warn("[useElementPicker] Failed to stop backend inspector:", e);
    }
  }, [selectedAction, updateNodeState, activeBrowserId]);

  // START PICKING HANDLER
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
      let needsLaunch = isRemote || !activeBrowserId;

      const getStartingUrl = () => {
        const openUrlNode = nodes.find(
          (n) => n.type === "open_url" || n.data?.type === "open_url",
        );
        return (
          openUrlNode?.data?.configuration?.url || "https://www.google.com"
        );
      };

      try {
        let inspectorBrowserId = activeBrowserId;

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
                data.message?.includes("dead")
              ) {
                inspectorBrowserId = null;
                needsLaunch = true;
              } else {
                throw new Error(data.message);
              }
            }
          } catch (err) {
            if (
              err?.response?.data?.code === "BROWSER_DISCONNECTED" ||
              err.message?.includes("dead")
            ) {
              inspectorBrowserId = null;
              needsLaunch = true;
            } else {
              throw err;
            }
          }
        }

        if (needsLaunch || !inspectorBrowserId) {
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
      nodes,
      edges,
      executeFlow,
      handleCancelPicking,
    ],
  );

  // ELEMENT PICKED HANDLER
  const handleElementPicked = useCallback(
    async (data) => {
      console.log("[useElementPicker] 🎯 Element Picked Event Received:", data);

      try {
        const sources = data.candidates || data.selectors || {};
        const isValidSelector =
          data &&
          (data.selector || (sources && Object.values(sources).some((v) => v)));

        if (!isValidSelector) {
          toast.error(
            t("common.selector_capture_failed", "Failed to capture element."),
          );
          nodes.forEach((n) => {
            if (n.data?.state === NODE_STATES.PICKING)
              updateNodeState(n.id, NODE_STATES.DEFAULT);
          });
          return;
        }

        let finalSelector = data.sanitizedSelector || data.selector;
        if (sources) {
          const id = sources.id;
          const dataAttr = sources.dataAttribute || sources.testId;
          const css = sources.css || sources.cssPath;
          const xpath = sources.xpath || sources.text;

          if (id) finalSelector = id;
          else if (dataAttr) finalSelector = dataAttr;
          else if (css) finalSelector = css;
          else if (xpath) finalSelector = xpath;
        }

        if (
          !finalSelector ||
          typeof finalSelector !== "string" ||
          finalSelector.trim() === ""
        ) {
          toast.error(t("common.selector_empty"));
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
                  configuration: {
                    ...node.data.configuration,
                    [pickingField]: trimmedSelector,
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
          await updateNodeConfiguration(selectedAction.nodeId, {
            ...selectedAction.data.configuration,
            [pickingField]: trimmedSelector,
          });
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
      t,
      toast,
    ],
  );

  return {
    pickingField,
    handleStartPicking,
    handleCancelPicking,
    handleElementPicked,
  };
};
