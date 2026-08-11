import Link from "next/link";
import { Bot, CheckCircle2, CircleAlert, ExternalLink, Play, ShieldCheck, XCircle } from "lucide-react";
import { approveAiDraftAction, rejectAiDraftAction, runAiNewsroomAction } from "@/app/admin/ai-newsroom/actions";
import { AdminShell } from "@/components/admin-shell";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { Notice } from "@/components/notice";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Draft = {
  id: string;
  title_en: string;
  category: string;
  status: "ready" | "needs_review" | "approved" | "rejected" | "failed";
  verification_score: number;
  similarity_score: number;
  image_license: string | null;
  image_url: string | null;
  source_items: Array<{ name: string; url: string }>;
  risk_flags: string[];
  created_at: string;
};

export default async function AiNewsroomPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string; status?: string }> }) {
  const profile = await requireStaff();
  const params = await searchParams;
  const admin = createAdminClient();
  let query = admin.from("ai_news_drafts").select("id,title_en,category,status,verification_score,similarity_score,image_license,image_url,source_items,risk_flags,created_at").order("created_at", { ascending: false }).limit(80);
  if (params.status && ["ready", "needs_review", "approved", "rejected"].includes(params.status)) query = query.eq("status", params.status);
  const [{ data, error: draftsError }, { data: recentRun, error: runError }] = await Promise.all([
    query,
    admin.from("ai_news_runs").select("*").order("started_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const drafts = (data || []) as Draft[];
  const databaseError = draftsError?.message || runError?.message || undefined;
  const counts = {
    ready: drafts.filter((d) => d.status === "ready").length,
    review: drafts.filter((d) => d.status === "needs_review").length,
    approved: drafts.filter((d) => d.status === "approved").length,
    rejected: drafts.filter((d) => d.status === "rejected").length,
  };
  const configured = Boolean(process.env.GEMINI_API_KEY && process.env.CRON_SECRET);

  return (
    <AdminShell profile={profile}>
      <div className="admin-heading ai-heading">
        <div><span>AI AUTOMATION</span><h1>AI Newsroom</h1><p>News discovery, verification, original writing, translations, text-similarity risk checks and licensed-image selection.</p></div>
        <form action={runAiNewsroomAction}><button className="primary-button" disabled={!configured}><Play size={18} /> Collect & prepare now</button></form>
      </div>
      <Notice message={params.message} error={params.error || databaseError} />
      {!configured && <div className="ai-config-warning"><CircleAlert size={20} /><div><strong>One-time setup required</strong><p>Add <code>GEMINI_API_KEY</code> and <code>CRON_SECRET</code> in Vercel. The code itself is already wired.</p></div></div>}
      <div className="stats-grid ai-stats"><div><small>Ready to approve</small><strong>{counts.ready}</strong></div><div><small>Needs review</small><strong>{counts.review}</strong></div><div><small>Approved</small><strong>{counts.approved}</strong></div><div><small>Rejected</small><strong>{counts.rejected}</strong></div></div>
      <section className="admin-panel">
        <div className="panel-heading ai-panel-heading"><div><h2>Automated drafts</h2><span>{drafts.length} recent records</span></div><div className="ai-filters"><Link href="/admin/ai-newsroom">All</Link><Link href="/admin/ai-newsroom?status=ready">Ready</Link><Link href="/admin/ai-newsroom?status=needs_review">Review</Link></div></div>
        {recentRun && <div className="ai-run-strip"><Bot size={16} /><span>Last run: <strong>{recentRun.status}</strong></span><span>Discovered {recentRun.discovered || 0}</span><span>Processed {recentRun.selected || 0}</span><span>Ready {recentRun.ready || 0}</span><small>{new Date(recentRun.started_at).toLocaleString("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" })}</small></div>}
        {drafts.length === 0 ? <div className="admin-empty"><Bot size={32} /><p>No AI drafts yet.</p><form action={runAiNewsroomAction}><button className="primary-button" disabled={!configured}>Run collector</button></form></div> : (
          <div className="ai-draft-list">{drafts.map((draft) => (
            <article className="ai-draft-card" key={draft.id}>
              <div className="ai-draft-main">
                <div className="ai-draft-topline"><span className={`ai-state ${draft.status}`}>{draft.status === "ready" ? <CheckCircle2 size={14} /> : draft.status === "needs_review" ? <CircleAlert size={14} /> : draft.status === "approved" ? <ShieldCheck size={14} /> : <XCircle size={14} />}{draft.status.replace("_", " ")}</span><span>{draft.category}</span><span>{new Date(draft.created_at).toLocaleString("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" })}</span></div>
                <h3><Link href={`/admin/ai-newsroom/${draft.id}`}>{draft.title_en}</Link></h3>
                <div className="ai-metrics"><span>Verification <strong>{draft.verification_score}%</strong></span><span>Text similarity <strong>{draft.similarity_score}%</strong></span><span>Sources <strong>{draft.source_items?.length || 0}</strong></span><span>Image <strong>{draft.image_license ? "licensed" : "fallback"}</strong></span></div>
                {draft.risk_flags?.length > 0 && <p className="ai-risk-line"><CircleAlert size={14} /> {draft.risk_flags[0]}</p>}
              </div>
              <div className="ai-draft-actions"><Link className="secondary-button" href={`/admin/ai-newsroom/${draft.id}`}>Preview <ExternalLink size={15} /></Link>{["ready", "needs_review"].includes(draft.status) && <><form action={approveAiDraftAction}><input type="hidden" name="id" value={draft.id} /><ConfirmSubmit className="primary-button" message={draft.status === "needs_review" ? "This draft has review flags. Publish it anyway?" : "Approve and publish this story now?"}>Approve & Publish</ConfirmSubmit></form><form action={rejectAiDraftAction}><input type="hidden" name="id" value={draft.id} /><ConfirmSubmit className="ai-reject-button" message="Reject this AI draft?">Reject</ConfirmSubmit></form></>}</div>
            </article>
          ))}</div>
        )}
      </section>
    </AdminShell>
  );
}
