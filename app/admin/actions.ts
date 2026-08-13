"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureProfile, requireOwner, requireStaff } from "@/lib/auth";
import { createAdminClient, getSupabaseConfigError, hasSupabaseAdminConfig, hasSupabaseAnonConfig } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function safeMessage(message: string) {
  return encodeURIComponent(message.slice(0, 180));
}

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function loginAction(formData: FormData) {
  if (!hasSupabaseAnonConfig()) redirect("/admin/login?error=" + safeMessage(getSupabaseConfigError()));
  const parsed = credentials.safeParse({ email: value(formData, "email").toLowerCase(), password: value(formData, "password") });
  if (!parsed.success) redirect("/admin/login?error=" + safeMessage("Enter a valid email and a password of at least 8 characters."));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect("/admin/login?error=" + safeMessage(error.message));
  const profile = await ensureProfile();
  if (!profile?.active) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=" + safeMessage("This email does not have active PDTV Newsroom access."));
  }
  redirect("/admin");
}

export async function activateAction(formData: FormData) {
  if (!hasSupabaseAnonConfig() || !hasSupabaseAdminConfig()) redirect("/admin/login?mode=activate&error=" + safeMessage(getSupabaseConfigError()));
  const parsed = credentials.safeParse({ email: value(formData, "email").toLowerCase(), password: value(formData, "password") });
  const fullName = value(formData, "full_name");
  if (!parsed.success || fullName.length < 2) redirect("/admin/login?mode=activate&error=" + safeMessage("Enter your name, approved email and a password of at least 8 characters."));
  const admin = createAdminClient();
  const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase();
  const { data: approved } = await admin.from("profiles").select("id,active").eq("email", parsed.data.email).maybeSingle();
  if (parsed.data.email !== ownerEmail && !approved?.active) redirect("/admin/login?mode=activate&error=" + safeMessage("Owner approval is required before this email can register."));

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { data: { full_name: fullName }, emailRedirectTo: `${siteUrl}/admin` },
  });
  if (error) redirect("/admin/login?mode=activate&error=" + safeMessage(error.message));
  if (data.session) {
    await ensureProfile();
    redirect("/admin");
  }
  redirect("/admin/login?message=" + safeMessage("Check your email to confirm the account, then sign in."));
}

export async function logoutAction() {
  if (!hasSupabaseAnonConfig()) redirect("/admin/login?error=" + safeMessage(getSupabaseConfigError()));
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function forgotPasswordAction(formData: FormData) {
  if (!hasSupabaseAnonConfig()) redirect("/admin/forgot-password?error=" + safeMessage(getSupabaseConfigError()));
  const email = value(formData, "email").toLowerCase();
  if (!z.string().email().safeParse(email).success) redirect("/admin/forgot-password?error=" + safeMessage("Enter a valid email address."));
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/admin/reset-password` });
  redirect("/admin/forgot-password?message=" + safeMessage("If this email is registered, a password reset link has been sent."));
}

export async function resetPasswordAction(formData: FormData) {
  if (!hasSupabaseAnonConfig()) redirect("/admin/reset-password?error=" + safeMessage(getSupabaseConfigError()));
  const password = value(formData, "password");
  if (password.length < 8) redirect("/admin/reset-password?error=" + safeMessage("Password must contain at least 8 characters."));
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/admin/reset-password?error=" + safeMessage(error.message));
  redirect("/admin?message=" + safeMessage("Password updated successfully."));
}

function slugify(input: string) {
  return input.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "") || `story-${Date.now()}`;
}

async function uploadImage(file: File, storyId: string) {
  if (!file.size) return null;
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be smaller than 5 MB.");
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed.");
  const admin = createAdminClient();
  const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  const path = `${storyId}/${Date.now()}.${extension}`;
  const { error } = await admin.storage.from("news-images").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return admin.storage.from("news-images").getPublicUrl(path).data.publicUrl;
}

const storySchema = z.object({
  title_en: z.string().min(5), title_ur: z.string().min(2), title_sd: z.string().min(2),
  summary_en: z.string().min(10), summary_ur: z.string().min(5), summary_sd: z.string().min(5),
  body_en: z.string().min(20), body_ur: z.string().min(10), body_sd: z.string().min(10),
  category: z.string().min(2), author: z.string().min(2),
});

export async function saveStoryAction(formData: FormData) {
  const profile = await requireStaff();
  const id = value(formData, "id") || crypto.randomUUID();
  const fields = {
    title_en: value(formData, "title_en"), title_ur: value(formData, "title_ur"), title_sd: value(formData, "title_sd"),
    summary_en: value(formData, "summary_en"), summary_ur: value(formData, "summary_ur"), summary_sd: value(formData, "summary_sd"),
    body_en: value(formData, "body_en"), body_ur: value(formData, "body_ur"), body_sd: value(formData, "body_sd"),
    category: value(formData, "category"), author: value(formData, "author"),
  };
  const parsed = storySchema.safeParse(fields);
  if (!parsed.success) redirect(`/admin/stories/${value(formData, "id") || "new"}?error=` + safeMessage("Complete all English, Urdu and Sindhi fields before saving."));

  let imageUrl = value(formData, "existing_image") || null;
  const image = formData.get("image");
  try {
    if (image instanceof File && image.size) imageUrl = await uploadImage(image, id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image upload failed.";
    redirect(`/admin/stories/${value(formData, "id") || "new"}?error=` + safeMessage(message));
  }

  const admin = createAdminClient();
  const requestedSlug = value(formData, "slug");
  const payload = {
    id,
    ...parsed.data,
    slug: slugify(requestedSlug || parsed.data.title_en),
    image_url: imageUrl,
    is_breaking: formData.get("is_breaking") === "on",
    is_lead: formData.get("is_lead") === "on",
    status: formData.get("intent") === "publish" ? "published" : "draft",
    published_at: formData.get("intent") === "publish" ? new Date().toISOString() : null,
    created_by: profile.id,
    updated_at: new Date().toISOString(),
  };
  const { error } = await admin.from("stories").upsert(payload, { onConflict: "id" });
  if (error) redirect(`/admin/stories/${value(formData, "id") || "new"}?error=` + safeMessage(error.message));
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?message=" + safeMessage(payload.status === "published" ? "Story published successfully." : "Draft saved successfully."));
}

export async function togglePublishAction(formData: FormData) {
  await requireStaff();
  const id = value(formData, "id");
  const nextStatus = value(formData, "next_status") === "published" ? "published" : "draft";
  const admin = createAdminClient();
  await admin.from("stories").update({ status: nextStatus, published_at: nextStatus === "published" ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/"); revalidatePath("/admin");
  redirect("/admin?message=" + safeMessage(nextStatus === "published" ? "Story published." : "Story moved to drafts."));
}

export async function deleteDraftAction(formData: FormData) {
  await requireStaff();
  const admin = createAdminClient();
  const id = value(formData, "id");
  const { data } = await admin.from("stories").select("status").eq("id", id).maybeSingle();
  if (data?.status !== "draft") redirect("/admin?error=" + safeMessage("Only drafts can be deleted. Unpublish the story first."));
  await admin.from("stories").delete().eq("id", id);
  revalidatePath("/admin");
  redirect("/admin?message=" + safeMessage("Draft permanently deleted."));
}

export async function addEditorAction(formData: FormData) {
  await requireOwner();
  const email = value(formData, "email").toLowerCase();
  const fullName = value(formData, "full_name");
  if (!z.string().email().safeParse(email).success || fullName.length < 2) redirect("/admin/editors?error=" + safeMessage("Enter a valid name and email."));
  const admin = createAdminClient();
  const { data: existing } = await admin.from("profiles").select("role").eq("email", email).maybeSingle();
  if (existing?.role === "owner") redirect("/admin/editors?error=" + safeMessage("The owner account cannot be changed."));
  const { error } = await admin.from("profiles").upsert({ email, full_name: fullName, role: "editor", active: true }, { onConflict: "email" });
  if (error) redirect("/admin/editors?error=" + safeMessage(error.message));
  revalidatePath("/admin/editors");
  redirect("/admin/editors?message=" + safeMessage("Editor approved. They can now activate their account."));
}

export async function removeEditorAction(formData: FormData) {
  await requireOwner();
  const admin = createAdminClient();
  await admin.from("profiles").update({ active: false }).eq("id", value(formData, "id")).eq("role", "editor");
  revalidatePath("/admin/editors");
  redirect("/admin/editors?message=" + safeMessage("Editor access removed."));
}
