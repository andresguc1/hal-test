import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "../../hooks/useToast";
import { HalToaster } from "../Toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  React.useEffect(() => {
    const isProd = import.meta.env.MODE === "production";
    const isAuthEnabled = import.meta.env.VITE_AUTH_ENABLED !== "false";
    if ((!isProd && !isAuthEnabled) || user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back to HAL-TEST!");
      navigate("/");
    } catch (error) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#020617] text-slate-100 p-4 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 p-10 rounded-2xl border border-white/5 bg-[#0f172a]/60 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(37,99,235,0.25)] relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-6 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <img
              src="/app/images/logo.jpg"
              alt="Haltest Logo"
              className="relative w-20 h-20 rounded-2xl border border-white/10 shadow-2xl object-cover transform transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            HAL-TEST
          </h1>
          <p className="text-slate-400 font-medium">
            Autonomous Browser Automation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="login-email"
                className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 ml-1"
              >
                Email Address
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-3 top-3.5 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors"
                  aria-hidden="true"
                />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="pl-10 bg-slate-900/40 border-white/5 focus:border-blue-500/50 focus:ring-blue-500/10 h-12 text-sm transition-all duration-300 placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="login-password"
                className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 ml-1"
              >
                Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-3 top-3.5 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors"
                  aria-hidden="true"
                />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pl-10 bg-slate-900/40 border-white/5 focus:border-blue-500/50 focus:ring-blue-500/10 h-12 text-sm transition-all duration-300 placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-blue-500/20 border-t border-white/10"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Authorize Access"
            )}
          </Button>
        </form>

        <div className="text-center space-y-4">
          <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent w-full" />
          <div className="text-xs">
            <span className="text-slate-500">Need an operative account? </span>
            <Link
              to="/signup"
              className="text-blue-400 hover:text-blue-300 font-bold transition-colors underline-offset-4 hover:underline"
            >
              Initialize onboarding
            </Link>
          </div>
        </div>
      </div>
      <HalToaster />
    </div>
  );
}
