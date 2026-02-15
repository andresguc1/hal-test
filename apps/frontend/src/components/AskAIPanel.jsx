import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Bot,
  User,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "../utils/api";
import providersData from "@/data/providers.json";

/**
 * AskAIPanel
 * Debug console for testing LLM connectivity.
 * Sends prompts to the Ask AI endpoint and displays responses.
 */
export default function AskAIPanel({ isVisible, onClose, onOpenSettings }) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [conversation, setConversation] = useState([]);
  const [activeConfig, setActiveConfig] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Check AI configuration from localStorage
  const checkAIConfig = () => {
    try {
      const configStr = localStorage.getItem("hal_ai_config");
      if (!configStr) return null;
      const config = JSON.parse(configStr);

      if (config.activeProvider && config.selectedModel) {
        const provider = providersData.find(
          (p) => p.id === config.activeProvider,
        );
        return {
          providerName: provider ? provider.name : config.activeProvider,
          modelId: config.selectedModel,
        };
      }
      return null;
    } catch (e) {
      console.error("[AskAI] Error parsing config:", e);
      return null;
    }
  };

  // Check config on mount and listen for config updates
  useEffect(() => {
    setActiveConfig(checkAIConfig());

    const handleConfigUpdate = () => setActiveConfig(checkAIConfig());
    window.addEventListener("hal_ai_config_updated", handleConfigUpdate);
    window.addEventListener("storage", handleConfigUpdate);

    return () => {
      window.removeEventListener("hal_ai_config_updated", handleConfigUpdate);
      window.removeEventListener("storage", handleConfigUpdate);
    };
  }, []);

  // Re-check when panel becomes visible
  useEffect(() => {
    if (isVisible) {
      setActiveConfig(checkAIConfig());
    }
  }, [isVisible]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);

  // Focus input when panel opens (only if configured)
  useEffect(() => {
    if (isVisible && activeConfig && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isVisible, activeConfig]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userMessage = { role: "user", content: prompt.trim() };
    setConversation((prev) => [...prev, userMessage]);
    setPrompt("");
    setIsLoading(true);

    try {
      const res = await api.post("/ai/ask", {
        prompt: userMessage.content,
        messages: conversation, // Send previous history
      });

      if (res.success) {
        setConversation((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.text,
            model: res.model,
            provider: res.provider,
            usage: res.usage,
          },
        ]);
      } else {
        setConversation((prev) => [
          ...prev,
          {
            role: "error",
            content: res.error || "Unknown error",
          },
        ]);
      }
    } catch (error) {
      setConversation((prev) => [
        ...prev,
        {
          role: "error",
          content: error.message || "Failed to connect to AI service",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setConversation([]);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 z-30 flex flex-col transition-all duration-300 ease-out",
        isExpanded ? "h-[360px]" : "h-10",
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 h-10 min-h-[40px] bg-[#0c0c0d]/95 backdrop-blur-xl border-t border-indigo-500/20 cursor-pointer select-none">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          <Sparkles size={14} className="text-indigo-400" />
          <span>Ask AI</span>
          <span className="text-[10px] text-slate-600 font-mono">
            (Debug Console)
          </span>
          {activeConfig && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
              <span className="text-[10px] text-indigo-300 truncate max-w-[150px]">
                {activeConfig.providerName} • {activeConfig.modelId}
              </span>
            </div>
          )}
          {isExpanded ? (
            <ChevronDown size={12} className="text-slate-500" />
          ) : (
            <ChevronUp size={12} className="text-slate-500" />
          )}
        </button>

        <div className="flex items-center gap-1">
          {conversation.length > 0 && (
            <button
              onClick={handleClear}
              className="p-1.5 rounded text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors"
              title="Clear conversation"
            >
              <Trash2 size={12} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors"
            title="Close"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      {isExpanded && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0b]/95 backdrop-blur-xl">
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">
            {!activeConfig ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Settings size={32} className="text-slate-600 mb-3" />
                <p className="text-sm text-slate-400">
                  Configure your AI provider to start chatting
                </p>
                <p className="text-[10px] text-slate-600 mt-1 mb-3">
                  Go to Settings → AI & Integrations → select a provider and
                  model
                </p>
                {onOpenSettings && (
                  <button
                    onClick={() => {
                      onClose?.();
                      onOpenSettings();
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 px-3 py-1.5 rounded-lg hover:bg-indigo-500/10 transition-all"
                  >
                    Open Settings
                  </button>
                )}
              </div>
            ) : conversation.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles size={32} className="text-indigo-500/30 mb-3" />
                <p className="text-sm text-slate-500">
                  Ask HAL-9001 anything about testing
                </p>
                <p className="text-[10px] text-slate-700 mt-1">
                  e.g. &quot;Is this CSS selector valid: #login-button&quot;
                </p>
              </div>
            ) : null}

            {conversation.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2.5 text-sm animate-in fade-in slide-in-from-bottom-2 duration-200",
                  msg.role === "user" && "justify-end",
                )}
              >
                {msg.role !== "user" && (
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      msg.role === "assistant"
                        ? "bg-indigo-500/20"
                        : "bg-red-500/20",
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <Bot size={12} className="text-indigo-400" />
                    ) : (
                      <AlertCircle size={12} className="text-red-400" />
                    )}
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2",
                    msg.role === "user"
                      ? "bg-indigo-600/20 text-indigo-100 border border-indigo-500/10"
                      : msg.role === "error"
                        ? "bg-red-500/10 text-red-300 border border-red-500/10"
                        : "bg-slate-800/50 text-slate-200 border border-slate-700/30",
                  )}
                >
                  <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                    {msg.content}
                  </pre>
                  {msg.model && (
                    <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-white/5">
                      <span className="text-[10px] text-slate-600 font-mono">
                        {msg.provider}/{msg.model}
                      </span>
                      {msg.usage && (
                        <span className="text-[10px] text-slate-700">
                          • {(msg.usage.totalTokens || 0).toLocaleString()}{" "}
                          tokens
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={12} className="text-slate-400" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Loader2 size={12} className="text-indigo-400 animate-spin" />
                </div>
                <span className="animate-pulse">HAL-9001 is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-4 py-2.5 border-t border-white/5 bg-[#0c0c0d]/80"
          >
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeConfig
                  ? "Ask about testing, selectors, automation..."
                  : "Configure AI to chat..."
              }
              disabled={isLoading || !activeConfig}
              className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading || !activeConfig}
              className={cn(
                "p-2 rounded-lg transition-all",
                prompt.trim() && !isLoading && activeConfig
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-slate-800/50 text-slate-600 cursor-not-allowed",
              )}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
