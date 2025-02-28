import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: true,
    flowType: "pkce",
    debug: true, // Enable debug mode temporarily to help diagnose issues
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "X-Client-Info": "anonova-web",
    },
  },
});

// Add error logging
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth state changed:", event, session);
});
