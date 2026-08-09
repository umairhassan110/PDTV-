import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function currentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function ensureProfile(): Promise<Profile | null> {
  const user = await currentUser();
  if (!user?.email) return null;

  const admin = createAdminClient();
  const normalizedEmail = user.email.toLowerCase();
  const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase();

  const { data: existing } = await admin
    .from("profiles")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existing) {
    if (!existing.user_id) {
      const { data } = await admin
        .from("profiles")
        .update({ user_id: user.id })
        .eq("id", existing.id)
        .select("*")
        .single();
      return data as Profile;
    }
    return existing as Profile;
  }

  if (ownerEmail && normalizedEmail === ownerEmail) {
    const { data } = await admin
      .from("profiles")
      .insert({
        user_id: user.id,
        email: normalizedEmail,
        full_name: user.user_metadata?.full_name || "PDTV Owner",
        role: "owner",
        active: true,
      })
      .select("*")
      .single();
    return data as Profile;
  }

  return null;
}

export async function requireStaff(): Promise<Profile> {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const profile = await ensureProfile();
  if (!profile?.active) redirect("/admin/not-authorized");
  return profile;
}

export async function requireOwner(): Promise<Profile> {
  const profile = await requireStaff();
  if (profile.role !== "owner") redirect("/admin");
  return profile;
}

