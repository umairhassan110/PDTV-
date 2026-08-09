import { createAdminClient } from "@/lib/supabase/admin";
import type { Story } from "@/lib/types";

export async function publishedStories(limit = 30): Promise<Story[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("stories")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as Story[];
}

export async function storyBySlug(slug: string): Promise<Story | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("stories")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data as Story | null;
}

