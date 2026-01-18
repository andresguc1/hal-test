/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if authentication is disabled (ONLY allowed in non-production)
    const isDev = import.meta.env.DEV || import.meta.env.MODE !== "production";
    const isAuthDisabled = import.meta.env.VITE_AUTH_ENABLED === "false";

    if (isDev && isAuthDisabled) {
      setUser({
        id: "local-dev-user",
        email: "local@haltest.dev",
        role: "admin",
      });
      setSession({ access_token: "local-dev-token" });
      setLoading(false);
      return;
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const isDev = import.meta.env.DEV || import.meta.env.MODE !== "production";
    if (isDev && import.meta.env.VITE_AUTH_ENABLED === "false") {
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
    const isDev = import.meta.env.DEV || import.meta.env.MODE !== "production";
    if (isDev && import.meta.env.VITE_AUTH_ENABLED === "false") {
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
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const isDev = import.meta.env.DEV || import.meta.env.MODE !== "production";
    if (isDev && import.meta.env.VITE_AUTH_ENABLED === "false") {
      setUser(null);
      setSession(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    signUp,
    signIn,
    signOut,
    user,
    session,
    loading,
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
