"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfigError, hasSupabaseAnonConfig } from "@/lib/supabase/admin";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasSupabaseAnonConfig() || !url || !anonKey) {
    throw new Error(getSupabaseConfigError());
  }

  return createBrowserClient(url, anonKey);
}

