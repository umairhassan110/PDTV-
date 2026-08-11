import Link from "next/link";
import { CirclePlus, Eye, FilePenLine, Radio, Trash2 } from "lucide-react";
import { deleteDraftAction, togglePublishAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { Notice } from "@/components/notice";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Story } from "@/lib/types";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const profile = await requireStaff();
  const params = await searchParams;
  const admin = createAdminClient();
  const { data } = await admin.from("stories").select("*").order("updated_at", { ascending: false });
  const stories = (data || []) as Story[];
  const drafts = stories.filter((story) => story.status === "draft").length;
  const published = stories.length - drafts;
  return (
    <AdminShell profile={profile}>
      <div className="admin-heading"><div><span>CONTENT MANAGEMENT</span><h1>Newsroom overview</h1><p>Create, review and publish PDTV stories in three languages.</p></div><Link className="primary-button" href="/admin/stories/new"><CirclePlus size={18} /> New Story</Link></div>
      <Notice message={params.message} error={params.error} />
      <div className="stats-grid"><div><small>Total stories</small><strong>{stories.length}</strong></div><div><small>Published</small><strong>{published}</strong></div><div><small>Drafts</small><strong>{drafts}</strong></div><div><small>Breaking</small><strong>{stories.filter((s) => s.is_breaking && s.status === "published").length}</strong></div></div>
      <section className="admin-panel">
        <div className="panel-heading"><h2>All stories</h2><span>{stories.length} records</span></div>
        {stories.length === 0 ? <div className="admin-empty"><FilePenLine size={30} /><p>No stories yet.</p><Link href="/admin/stories/new">Create your first story</Link></div> : (
          <div className="story-table-wrap"><table className="story-table"><thead><tr><th>Story</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>
            {stories.map((story) => <tr key={story.id}><td><strong>{story.title_en}</strong><small>{story.category} · {story.author}</small></td><td><span className={`status ${story.status}`}>{story.status}</span>{story.is_breaking && <span className="breaking-badge"><Radio size={11} /> Breaking</span>}</td><td>{new Date(story.updated_at).toLocaleDateString("en-PK", { timeZone: "Asia/Karachi" })}</td><td><div className="table-actions"><Link title="Edit" href={`/admin/stories/${story.id}`}><FilePenLine size={17} /></Link>{story.status === "published" && <Link title="View" target="_blank" href={`/news/${story.slug}`}><Eye size={17} /></Link>}<form action={togglePublishAction}><input type="hidden" name="id" value={story.id} /><input type="hidden" name="next_status" value={story.status === "published" ? "draft" : "published"} /><button>{story.status === "published" ? "Unpublish" : "Publish"}</button></form>{story.status === "draft" && <form action={deleteDraftAction}><input type="hidden" name="id" value={story.id} /><ConfirmSubmit className="danger-icon" message="Permanently delete this draft?"><Trash2 size={17} /></ConfirmSubmit></form>}</div></td></tr>)}
          </tbody></table></div>
        )}
      </section>
    </AdminShell>
  );
}

