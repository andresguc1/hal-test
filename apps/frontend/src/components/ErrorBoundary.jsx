import React, { Component } from "react";
import { AlertTriangle, RotateCcw, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] React Flow crashed:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
      this.setState({ hasError: false, error: null });
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-md z-[9999] p-6 border border-white/10 rounded-2xl m-4">
          <div className="max-w-md w-full text-center space-y-6 bg-slate-900/90 border border-white/5 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
            {/* Background glowing gradient */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full filter blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/20 rounded-full filter blur-3xl pointer-events-none" />

            <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 animate-pulse">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Canvas Engine Crash
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We detected an unstable state or corrupted node position in the
                canvas. Don't worry, your progress has been safely locked.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] font-mono text-rose-300 max-h-24 overflow-y-auto text-left select-text custom-scrollbar">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs font-semibold text-slate-200 hover:text-white rounded-xl transition-all"
              >
                <RefreshCw
                  size={14}
                  className="animate-spin [animation-duration:2s]"
                />
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 text-xs font-semibold text-white rounded-xl transition-all"
              >
                <RotateCcw size={14} />
                Reset Canvas
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
