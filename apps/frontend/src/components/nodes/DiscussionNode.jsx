import React, { memo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "../../context/AuthContext";
import { MessageSquare, Send } from "lucide-react";

function DiscussionNode({ id, data, selected }) {
  const { user } = useAuth();
  const comments = data?.configuration?.comments ?? [];
  const [newComment, setNewComment] = useState("");

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

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
              className="flex flex-col gap-0.5 bg-slate-950/40 p-2 rounded-lg border border-slate-800/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  style={{ color: c.userColor }}
                  className="text-[10px] font-bold truncate max-w-[120px]"
                >
                  {c.userName}
                </span>
                <span className="text-[8px] text-slate-500 font-medium">
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

      {/* INPUT FORM */}
      <form
        onSubmit={handleAddComment}
        className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80"
      >
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Type comment..."
          className="flex-1 bg-slate-950/80 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500/60 font-medium"
        />
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
