import { UserPlus, UserX } from "lucide-react";
import { addEditorAction, removeEditorAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { Notice } from "@/components/notice";
import { requireOwner } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

export default async function EditorsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const profile = await requireOwner();
  const params = await searchParams;
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("*").order("created_at");
  const profiles = (data || []) as Profile[];
  return <AdminShell profile={profile}>
    <div className="admin-heading"><div><span>ACCESS CONTROL</span><h1>Manage editors</h1><p>Approve an email before the editor activates their own secure account.</p></div></div>
    <Notice message={params.message} error={params.error} />
    <section className="admin-panel editor-invite"><div className="panel-heading"><h2>Add editor access</h2></div><form action={addEditorAction}><label>Editor name<input name="full_name" required /></label><label>Editor email<input name="email" type="email" required /></label><button className="primary-button"><UserPlus size={18} /> Approve editor</button></form><p className="security-note">No password is stored here. The editor opens the login page and creates their own password after approval.</p></section>
    <section className="admin-panel"><div className="panel-heading"><h2>Team access</h2><span>{profiles.filter((p) => p.active).length} active</span></div><div className="editor-list">{profiles.map((item) => <div key={item.id}><span className="avatar">{item.full_name.slice(0, 1).toUpperCase()}</span><div><strong>{item.full_name}</strong><small>{item.email}</small></div><span className={`status ${item.active ? "published" : "draft"}`}>{item.active ? item.role : "inactive"}</span>{item.role === "editor" && item.active && <form action={removeEditorAction}><input type="hidden" name="id" value={item.id} /><ConfirmSubmit message={`Remove access for ${item.email}?`} className="danger-button"><UserX size={16} /> Remove</ConfirmSubmit></form>}</div>)}</div></section>
  </AdminShell>;
}

