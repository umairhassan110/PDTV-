import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { StoryForm } from "@/components/story-form";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Story } from "@/lib/types";

export default async function EditStoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const profile = await requireStaff();
  const { id } = await params;
  const { error } = await searchParams;
  const admin = createAdminClient();
  const { data } = await admin.from("stories").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return <AdminShell profile={profile}><div className="admin-heading"><div><span>EDIT CONTENT</span><h1>Edit story</h1><p>Update the report and save a draft or publish it.</p></div></div><StoryForm story={data as Story} error={error} /></AdminShell>;
}

