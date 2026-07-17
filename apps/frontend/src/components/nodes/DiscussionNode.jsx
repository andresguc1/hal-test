import React, { memo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "../../context/AuthContext";
import { MessageSquare, Send, Sparkles, Loader2 } from "lucide-react";
import { useAIStore } from "../../context/AIContext";
import { api } from "../../utils/api";
import { useCollaboration } from "../../collaboration/CollaborationProvider";

function DiscussionNode({ id, data, selected }) {
  const { user } = useAuth();
  const { peers, isCollaborative } = useCollaboration();
  const comments = data?.configuration?.comments ?? [];
  const [newComment, setNewComment] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);

  const isAiReady = useAIStore((state) => state.isAiReady);
  const aiConfig = useAIStore((state) => state.aiConfig);
  const selectedKeyId = useAIStore((state) => state.selectedKeyId);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const activePeers = React.useMemo(() => {
    if (!isCollaborative) return [];
    return peers.filter((p) => p.editingNodeId === id);
  }, [peers, id, isCollaborative]);

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setErrorMsg(null);
    const commentObj = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userName: user?.name || "Anonymous",
      userColor: user?.color || "#64748b",
      text: newComment.trim(),
      timestamp: new Date().toISOString(),
    };

    const nextComments = [...comments, commentObj];

    const event = new CustomEvent("update-node-config", {
      detail: { nodeId: id, configuration: { comments: nextComments } },
    });
    window.dispatchEvent(event);
    setNewComment("");
  };

  const handleAskAI = async () => {
    if (isGeneratingAI || !isAiReady) return;
    setIsGeneratingAI(true);
    setErrorMsg(null);
    try {
      const provider = aiConfig.activeProvider;
      const model = aiConfig.selectedModel;
      const apiKeyToSend =
        selectedKeyId !== "default" ? selectedKeyId : aiConfig.keys?.[provider];

      const threadContext =
        comments.length > 0
          ? comments.map((c) => `${c.userName}: ${c.text}`).join("\n")
          : "(No messages in this thread yet. Introduce yourself and ask how you can help.)";

      const res = await api.post(
        "/ai/chat",
        {
          messages: [
            {
              role: "user",
              content: `You are HAL, a helpful AI collaborator assisting test engineers in a web automation workspace.
Here is the current conversation thread:
${threadContext}

Please participate in the discussion. Answer questions, suggest improvements, or summarize what has been discussed. Keep your response brief, friendly, and under 3 sentences.`,
            },
          ],
        },
        {
          headers: {
            "x-ai-provider": provider,
            "x-ai-model": model,
            ...(apiKeyToSend && { "x-ai-api-key": apiKeyToSend }),
          },
        },
      );

      const replyText = res.message || res.text || "";
      if (replyText.trim()) {
        const commentObj = {
          id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userName: "HAL-9001",
          userColor: "#a78bfa", // Violet
          text: replyText.trim(),
          timestamp: new Date().toISOString(),
          isAi: true,
        };
        const nextComments = [...comments, commentObj];
        const event = new CustomEvent("update-node-config", {
          detail: { nodeId: id, configuration: { comments: nextComments } },
        });
        window.dispatchEvent(event);
      }
    } catch (err) {
      console.error("Failed to generate AI comment:", err);
      setErrorMsg(err.message || "Failed to generate AI comment.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div
      className={cn(
        "relative p-3 rounded-xl border-[2px] transition-all duration-200 select-none",
        "bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-2xl backdrop-blur-md",
        "w-[300px] flex flex-col gap-2 min-h-[220px]",
        selected
          ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] ring-2 ring-indigo-500/20"
          : "",
      )}
    >
      {/* HEADER */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <div className="p-1 bg-indigo-500/10 rounded border border-indigo-500/20 text-indigo-400">
          <MessageSquare size={14} />
        </div>
        <span className="text-xs font-black uppercase tracking-wider text-slate-300">
          Discussion Board
        </span>
        {activePeers.length > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            {activePeers.map((peer) => (
              <div
                key={peer.clientId}
                style={{ backgroundColor: peer.color || "#6b7280" }}
                className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm border border-slate-900"
                title={`${peer.name || "Anonymous"} is viewing this discussion`}
              >
                {(peer.name || "A").substring(0, 1).toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COMMENTS LIST */}
      <div className="flex-1 overflow-y-auto max-h-[160px] pr-1 flex flex-col gap-2 scrollbar-thin">
        {comments.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[11px] text-slate-500 italic py-6">
            No messages yet. Start the conversation!
          </div>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className={cn(
                "flex flex-col gap-0.5 bg-slate-950/40 p-2 rounded-lg border border-slate-800/40",
                c.isAi ||
                  c.userName?.includes("(AI)") ||
                  c.userName === "HAL-9001"
                  ? "border-violet-500/40 bg-violet-950/20 shadow-[0_0_10px_rgba(139,92,246,0.05)]"
                  : "",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    style={{ color: c.userColor }}
                    className="text-[10px] font-bold truncate max-w-[120px]"
                  >
                    {c.userName}
                  </span>
                  {(c.isAi ||
                    c.userName?.includes("(AI)") ||
                    c.userName === "HAL-9001") && (
                    <span className="text-[7px] font-black bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-1 py-0.25 rounded uppercase tracking-wider scale-90 origin-left flex items-center gap-0.5 shrink-0 select-none">
                      <Sparkles size={6} className="text-white" />
                      SYSTEM AI
                    </span>
                  )}
                </div>
                <span className="text-[8px] text-slate-500 font-medium shrink-0">
                  {new Date(c.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed break-words font-medium">
                {c.text}
              </p>
            </div>
          ))
        )}
      </div>

      {/* ERROR MESSAGE IF ANY */}
      {errorMsg && (
        <div className="text-[10px] text-rose-400 bg-rose-950/50 border border-rose-900/60 p-2 rounded leading-relaxed select-text font-medium">
          {errorMsg}
        </div>
      )}

      {/* INPUT FORM */}
      <form
        onSubmit={handleAddComment}
        className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80"
      >
        <input
          type="text"
          value={newComment}
          onChange={(e) => {
            setNewComment(e.target.value);
            if (errorMsg) setErrorMsg(null);
          }}
          placeholder="Type comment..."
          className="flex-1 bg-slate-950/80 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500/60 font-medium"
        />
        {isAiReady && (
          <button
            type="button"
            onClick={handleAskAI}
            disabled={isGeneratingAI}
            className="p-1 rounded bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
            title="Ask AI to participate"
          >
            {isGeneratingAI ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Sparkles size={12} />
            )}
          </button>
        )}
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
        >
          <Send size={12} />
        </button>
      </form>
    </div>
  );
}

export default memo(DiscussionNode);
