/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [authMode, setAuthMode] = useState("cloud"); // "local" | "cloud"

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Detect Mode from Backend
        const res = await fetch("/api/status").catch(() => null);
        const status = res ? await res.json().catch(() => ({})) : {};
        const isLocal =
          status.mode === "local" ||
          import.meta.env.VITE_HALTEST_MODE === "local";

        setAuthMode(isLocal ? "local" : "cloud");

        if (isLocal) {
          console.log("[Auth] Local Mode Detected - Enabling Guest Session");
          setUser({
            id: "guest-user",
            email: "guest@haltest.dev",
            role: "guest",
            isGuest: true,
          });
          setSession({ access_token: "local-guest-token" });
          setLoading(false);
          return;
        }

        // 2. Cloud Mode - Regular Supabase Auth
        const isAuthEnabled = import.meta.env.VITE_AUTH_ENABLED !== "false";
        const isProd = import.meta.env.MODE === "production";

        if (!isProd && !isAuthEnabled) {
          setUser({
            id: "local-dev-user",
            email: "local@haltest.dev",
            role: "admin",
          });
          setSession({ access_token: "local-dev-token" });
          setLoading(false);
          return;
        }

        // Check active sessions
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setLoading(false);

        // Listen for changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        });

        return () => subscription.unsubscribe();
      } catch (err) {
        console.error("Auth Init Error:", err);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email, password) => {
    const isProd = import.meta.env.MODE === "production";
    const isAuthEnabled = import.meta.env.VITE_AUTH_ENABLED !== "false";
    if (!isProd && !isAuthEnabled) {
      setUser({
        id: "local-dev-user",
        email: "local@haltest.dev",
        role: "admin",
      });
      setSession({ access_token: "local-dev-token" });
      return {
        user: { id: "local-dev-user" },
        session: { access_token: "local-dev-token" },
      };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password) => {
    const isProd = import.meta.env.MODE === "production";
    const isAuthEnabled = import.meta.env.VITE_AUTH_ENABLED !== "false";
    if (!isProd && !isAuthEnabled) {
      setUser({
        id: "local-dev-user",
        email: "local@haltest.dev",
        role: "admin",
      });
      setSession({ access_token: "local-dev-token" });
      return {
        user: { id: "local-dev-user" },
        session: { access_token: "local-dev-token" },
      };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app/`,
      },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    // Force cleanup first
    setUser(null);
    setSession(null);
    await supabase.auth.signOut().catch(console.warn);
  };

  const value = {
    signUp,
    signIn,
    signOut,
    user,
    session,
    loading,
    authMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
