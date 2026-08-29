import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Provide dummy values if missing to prevent createClient from throwing a hard crash during startup
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient(
        "https://placeholder-project.supabase.co",
        "placeholder-key",
      );

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("[AUTH] Supabase not configured; running in guest mode.");
}
