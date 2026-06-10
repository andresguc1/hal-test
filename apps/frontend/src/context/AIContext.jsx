import { create } from "zustand";
import { api } from "../utils/api";

// We keep the logic inside the store but it might need access to outside dependencies like toast and settings.
// Since Zustand stores are outside React, we can inject them when calling the actions or pass them as parameters.

// eslint-disable-next-line react-refresh/only-export-components
export const useAIStore = create((set, get) => ({
  chatMessages: [],
  isGenerating: false,
  selectedKeyId: "default",
  isAiReady: false,
  availableKeys: [],
  aiConfig: null,
  
  setInitialContext: (settings, available) => {
    const isReady = () => {
      if (!settings) return false;
      const provider = settings.activeProvider;
      if (provider === "ollama") return true;
      const key = settings.keys?.[provider];
      return !!(provider && key);
    };

    set((state) => {
      let nextKeyId = state.selectedKeyId;
      if (available && available.length > 0) {
        if (!available.find((k) => k.id === state.selectedKeyId)) {
          nextKeyId = available[0].id;
        }
      } else {
        nextKeyId = "default";
      }

      return {
        aiConfig: settings,
        availableKeys: available || [],
        selectedKeyId: nextKeyId,
        isAiReady: isReady(),
      };
    });
  },

  setSelectedKeyId: (id) => set({ selectedKeyId: id }),

  clearMessages: () => set({ chatMessages: [] }),

  sendMessage: async (text, browserId = null, toast) => {
    const state = get();
    if (!text.trim() || !state.isAiReady) return;

    set((s) => ({
      isGenerating: true,
      chatMessages: [...s.chatMessages, { role: "user", content: text }],
    }));

    try {
      const provider = state.aiConfig.activeProvider;
      const model = state.aiConfig.selectedModel;

      let apiKeyToSend;
      if (state.selectedKeyId !== "default") {
        apiKeyToSend = state.selectedKeyId;
      } else {
        apiKeyToSend = state.aiConfig.keys?.[provider];
      }

      const historyToSend = get().chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let canvasState = null;
      if (typeof window !== "undefined" && window.__HAL_GET_CANVAS_STATE__) {
        canvasState = window.__HAL_GET_CANVAS_STATE__();
      }

      const result = await api.post(
        "/ai/chat",
        {
          messages: historyToSend,
          browserId: browserId,
          aiConfig: state.aiConfig,
          canvasState,
        },
        {
          headers: {
            "x-ai-provider": provider,
            "x-ai-model": model,
            "x-ai-api-key": apiKeyToSend,
          },
        },
      );

      let finalContent = result.message || result.text || "";
      if (!finalContent.trim() && result.toolCalls && result.toolCalls.length > 0) {
        finalContent = "He ejecutado las acciones solicitadas en el lienzo.";
      }

      if (finalContent || (result.toolCalls && result.toolCalls.length > 0)) {
        set((s) => ({
          chatMessages: [
            ...s.chatMessages,
            {
              role: "assistant",
              content: finalContent,
              provider: result.provider || provider,
              model: result.model || model,
              usage: result.usage,
            },
          ],
        }));
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
      set((s) => ({
        chatMessages: [
          ...s.chatMessages,
          {
            role: "error",
            content: error.message || "Failed to connect to AI service",
          },
        ],
      }));
    } finally {
      set({ isGenerating: false });
    }
  },
}));

// eslint-disable-next-line react-refresh/only-export-components
export const useAIContext = () => useAIStore();

import React, { useEffect, useMemo } from "react";
import { useSettings } from "./SettingsContext";

export const AIProvider = ({ children }) => {
  const { aiConfig, vaultKeys } = useSettings();
  const setInitialContext = useAIStore((state) => state.setInitialContext);

  const availableKeys = useMemo(() => {
    if (!aiConfig?.activeProvider) return [];
    return vaultKeys?.filter((k) => k.provider === aiConfig.activeProvider) || [];
  }, [vaultKeys, aiConfig?.activeProvider]);

  useEffect(() => {
    setInitialContext(aiConfig, availableKeys);
  }, [aiConfig, availableKeys, setInitialContext]);

  return <>{children}</>;
};
