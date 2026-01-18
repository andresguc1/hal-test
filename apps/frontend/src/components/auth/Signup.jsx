import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "../../hooks/useToast";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  React.useEffect(() => {
    const isDev = import.meta.env.DEV || import.meta.env.MODE !== "production";
    const isAuthDisabled = import.meta.env.VITE_AUTH_ENABLED === "false";
    if ((isDev && isAuthDisabled) || user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password);
      toast.success(
        "Account created! Please check your email for verification.",
      );
      navigate("/login");
    } catch (error) {
      toast.error(error.message || "Failed to sign up");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#020617] text-slate-100 p-4 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 p-10 rounded-2xl border border-white/5 bg-[#0f172a]/60 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(79,70,229,0.2)] relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-6 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <img
              src="/app/images/logo.jpg"
              alt="Haltest Logo"
              className="relative w-20 h-20 rounded-2xl border border-white/10 shadow-2xl object-cover transform transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            JOIN HAL-TEST
          </h1>
          <p className="text-slate-400 font-medium">
            Deploy your browser automation node
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 ml-1">
                Mission Control Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-slate-900/40 border-white/5 focus:border-indigo-500/50 focus:ring-indigo-500/10 h-12 text-sm transition-all duration-300 placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 ml-1">
                Access Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 bg-slate-900/40 border-white/5 focus:border-indigo-500/50 focus:ring-indigo-500/10 h-12 text-sm transition-all duration-300 placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 ml-1">
                Confirm Security Key
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 bg-slate-900/40 border-white/5 focus:border-indigo-500/50 focus:ring-indigo-500/10 h-12 text-sm transition-all duration-300 placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-500/20 border-t border-white/10"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Initialize Onboarding"
            )}
          </Button>
        </form>

        <div className="text-center space-y-4">
          <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent w-full" />
          <div className="text-xs">
            <span className="text-slate-500">
              Already have an investigator ID?{" "}
            </span>
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors underline-offset-4 hover:underline"
            >
              Sign in to mission
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
