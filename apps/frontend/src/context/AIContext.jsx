import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";
import { useSettings } from "./SettingsContext";
import { api } from "../utils/api";
import { useToast } from "../hooks/useToast";

const AIContext = createContext({});

export const AIProvider = ({ children }) => {
  const { aiConfig, vaultKeys } = useSettings();
  const toast = useToast();

  const [chatMessages, setChatMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState("default");

  const availableKeys = useMemo(() => {
    if (!aiConfig?.activeProvider) return [];
    return (
      vaultKeys?.filter((k) => k.provider === aiConfig.activeProvider) || []
    );
  }, [vaultKeys, aiConfig?.activeProvider]);

  useEffect(() => {
    if (availableKeys.length > 0) {
      if (!availableKeys.find((k) => k.id === selectedKeyId)) {
        setSelectedKeyId(availableKeys[0].id);
      }
    } else {
      setSelectedKeyId("default");
    }
  }, [availableKeys, selectedKeyId]);

  const isAiReady = useMemo(() => {
    if (!aiConfig) return false;
    const provider = aiConfig.activeProvider;
    if (provider === "ollama") return true;
    const key = aiConfig.keys?.[provider];
    return !!(provider && key);
  }, [aiConfig]);

  const clearMessages = () => setChatMessages([]);

  const sendMessage = async (text, browserId = null) => {
    if (!text.trim() || !isAiReady) return;

    setIsGenerating(true);
    const newUserMsg = { role: "user", content: text };
    setChatMessages((prev) => [...prev, newUserMsg]);

    try {
      const provider = aiConfig.activeProvider;
      const model = aiConfig.selectedModel;

      let apiKeyToSend;
      if (selectedKeyId !== "default") {
        apiKeyToSend = selectedKeyId;
      } else {
        apiKeyToSend = aiConfig.keys?.[provider];
      }

      const historyToSend = [...chatMessages, newUserMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Fetch canvas state if available globally
      let canvasState = null;
      if (typeof window !== "undefined" && window.__HAL_GET_CANVAS_STATE__) {
        canvasState = window.__HAL_GET_CANVAS_STATE__();
      }

      const result = await api.post(
        "/ai/chat",
        {
          messages: historyToSend,
          browserId: browserId,
          aiConfig,
          canvasState, // Injected manual context for models with no tool support
        },
        {
          headers: {
            "x-ai-provider": provider,
            "x-ai-model": model,
            "x-ai-api-key": apiKeyToSend,
          },
        },
      );

      // Handle the different payload responses from `/ai/chat` vs `/ai/ask` endpoints if needed
      if (result.message) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.message,
            provider,
            model: result.model || model,
            usage: result.usage,
          },
        ]);
      } else if (result.text) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.text,
            provider: result.provider || provider,
            model: result.model || model,
            usage: result.usage,
          },
        ]);
      }

      if (result.toolCalls && result.toolCalls.length > 0) {
        result.toolCalls.forEach((tc) => {
          if (tc.function.name === "highlight_element") {
            toast.info("👁️ AI is inspecting the page...");
          }
          if (tc.function.name === "inspect_page") {
            toast.info("🧠 Analyzing page structure...");
          }
        });
      }
    } catch (error) {
      toast.error(`HAL Failed: ${error.message}`);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: error.message || "Failed to connect to AI service",
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AIContext.Provider
      value={{
        chatMessages,
        isGenerating,
        isAiReady,
        selectedKeyId,
        setSelectedKeyId,
        availableKeys,
        sendMessage,
        clearMessages,
        aiConfig,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAIContext = () => useContext(AIContext);
