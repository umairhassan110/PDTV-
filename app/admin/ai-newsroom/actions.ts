"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { runAiNewsroom } from "@/lib/ai-news/pipeline";
import { createAdminClient } from "@/lib/supabase/admin";

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function message(value: string) {
  return encodeURIComponent(value.slice(0, 220));
}

function slugify(input: string) {
  return input.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "") || `story-${Date.now()}`;
}

export async function runAiNewsroomAction() {
  await requireStaff();
  let result: Awaited<ReturnType<typeof runAiNewsroom>>;
  try {
    result = await runAiNewsroom();
  } catch (error) {
    redirect(`/admin/ai-newsroom?error=${message(error instanceof Error ? error.message : "AI Newsroom run failed.")}`);
  }
  revalidatePath("/admin/ai-newsroom");
  redirect(`/admin/ai-newsroom?message=${message(`AI run complete: ${result.ready} ready, ${result.needsReview} need review, ${result.selected} processed.`)}`);
}

export async function approveAiDraftAction(formData: FormData) {
  const profile = await requireStaff();
  const id = value(formData, "id");
  const admin = createAdminClient();
  const { data: draft, error } = await admin.from("ai_news_drafts").select("*").eq("id", id).maybeSingle();
  if (error || !draft) redirect(`/admin/ai-newsroom?error=${message(error?.message || "Draft not found.")}`);
  if (["approved", "rejected"].includes(draft.status)) redirect(`/admin/ai-newsroom?error=${message("This AI draft is already closed.")}`);

  let slug = slugify(draft.title_en);
  const { data: conflict } = await admin.from("stories").select("id").eq("slug", slug).maybeSingle();
  if (conflict) slug = `${slug}-${Date.now().toString().slice(-6)}`;
  const storyId = crypto.randomUUID();
  const { error: storyError } = await admin.from("stories").insert({
    id: storyId,
    slug,
    title_en: draft.title_en,
    title_ur: draft.title_ur,
    title_sd: draft.title_sd,
    summary_en: draft.summary_en,
    summary_ur: draft.summary_ur,
    summary_sd: draft.summary_sd,
    body_en: draft.body_en,
    body_ur: draft.body_ur,
    body_sd: draft.body_sd,
    category: draft.category,
    author: "PDTV News Desk",
    image_url: draft.image_url,
    image_credit: draft.image_author,
    image_source_url: draft.image_source_url,
    image_license: draft.image_license,
    image_license_url: draft.image_license_url,
    image_is_illustrative: draft.image_is_illustrative,
    source_links: draft.source_items || [],
    status: "published",
    is_breaking: false,
    is_lead: false,
    published_at: new Date().toISOString(),
    created_by: profile.id,
    updated_at: new Date().toISOString(),
  });
  if (storyError) redirect(`/admin/ai-newsroom/${id}?error=${message(storyError.message)}`);

  await admin.from("ai_news_drafts").update({ status: "approved", story_id: storyId, reviewed_by: profile.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/ai-newsroom");
  redirect(`/admin/ai-newsroom?message=${message("AI story approved and published.")}`);
}

export async function rejectAiDraftAction(formData: FormData) {
  const profile = await requireStaff();
  const id = value(formData, "id");
  const admin = createAdminClient();
  await admin.from("ai_news_drafts").update({ status: "rejected", reviewed_by: profile.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).in("status", ["ready", "needs_review"]);
  revalidatePath("/admin/ai-newsroom");
  redirect(`/admin/ai-newsroom?message=${message("AI draft rejected.")}`);
}
