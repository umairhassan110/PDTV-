import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CircleAlert, ExternalLink, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { approveAiDraftAction, rejectAiDraftAction } from "@/app/admin/ai-newsroom/actions";
import { AdminShell } from "@/components/admin-shell";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { Notice } from "@/components/notice";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AiDraftPreview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const profile = await requireStaff();
  const { id } = await params;
  const query = await searchParams;
  const admin = createAdminClient();
  const { data: draft } = await admin.from("ai_news_drafts").select("*").eq("id", id).maybeSingle();
  if (!draft) notFound();
  const sources = (draft.source_items || []) as Array<{ name: string; url: string; headline?: string; published_at?: string | null }>;
  const canReview = ["ready", "needs_review"].includes(draft.status);

  return (
    <AdminShell profile={profile}>
      <Link className="back-link" href="/admin/ai-newsroom"><ArrowLeft size={16} /> Back to AI Newsroom</Link>
      <Notice error={query.error} />
      <div className="ai-preview-header"><div><span>{draft.category} · {draft.status.replace("_", " ")}</span><h1>{draft.title_en}</h1><p>{draft.summary_en}</p></div>{canReview && <div className="ai-preview-actions"><form action={approveAiDraftAction}><input type="hidden" name="id" value={draft.id} /><ConfirmSubmit className="primary-button" message={draft.status === "needs_review" ? "Review flags exist. Approve and publish anyway?" : "Approve and publish this story?"}>Approve & Publish</ConfirmSubmit></form><form action={rejectAiDraftAction}><input type="hidden" name="id" value={draft.id} /><ConfirmSubmit className="ai-reject-button" message="Reject this AI draft?">Reject</ConfirmSubmit></form></div>}</div>

      <div className="ai-review-grid">
        <section className="admin-panel ai-preview-story">
          {draft.image_url && <div className="ai-preview-image"><Image src={draft.image_url} alt={draft.title_en} fill sizes="(max-width: 900px) 100vw, 760px" /></div>}
          {draft.image_url && <p className="ai-image-credit">Illustrative image · {draft.image_author || "Wikimedia Commons"} · {draft.image_license_url ? <a href={draft.image_license_url} target="_blank" rel="noreferrer">{draft.image_license || "license"}</a> : (draft.image_license || "license recorded")}{draft.image_source_url && <> · <a href={draft.image_source_url} target="_blank" rel="noreferrer">source <ExternalLink size={12} /></a></>}</p>}
          <article className="article-body ai-preview-body">{String(draft.body_en).split(/\n+/).filter(Boolean).map((p: string, i: number) => <p key={i}>{p}</p>)}</article>
          <details><summary>Urdu version</summary><h2 dir="rtl">{draft.title_ur}</h2><p dir="rtl">{draft.summary_ur}</p><div dir="rtl" className="article-body">{String(draft.body_ur).split(/\n+/).filter(Boolean).map((p: string, i: number) => <p key={i}>{p}</p>)}</div></details>
          <details><summary>Sindhi version</summary><h2 dir="rtl">{draft.title_sd}</h2><p dir="rtl">{draft.summary_sd}</p><div dir="rtl" className="article-body">{String(draft.body_sd).split(/\n+/).filter(Boolean).map((p: string, i: number) => <p key={i}>{p}</p>)}</div></details>
        </section>

        <aside className="ai-review-sidebar">
          <section className="admin-panel ai-score-panel"><h2><ShieldCheck size={18} /> Safety checks</h2><div className="ai-big-score"><strong>{draft.verification_score}%</strong><span>verification</span></div><div className="ai-score-row"><span>Text similarity risk</span><strong>{draft.similarity_score}%</strong></div><div className="ai-score-row"><span>Independent/source links</span><strong>{sources.length}</strong></div><p>{draft.verification_notes}</p></section>
          <section className="admin-panel"><h2>Risk flags</h2>{(draft.risk_flags || []).length ? <ul className="ai-flag-list">{draft.risk_flags.map((flag: string, i: number) => <li key={i}><CircleAlert size={14} />{flag}</li>)}</ul> : <p className="ai-clear"><ShieldCheck size={15} /> No material automatic flags.</p>}</section>
          <section className="admin-panel"><h2>Verified facts</h2><ul className="ai-fact-list">{(draft.verified_facts || []).map((fact: string, i: number) => <li key={i}>{fact}</li>)}</ul></section>
          <section className="admin-panel"><h2>Sources</h2><div className="ai-source-list">{sources.map((source, i) => <a key={`${source.url}-${i}`} href={source.url} target="_blank" rel="noreferrer"><strong>{source.name}</strong><span>{source.headline || source.url}</span><ExternalLink size={14} /></a>)}</div></section>
        </aside>
      </div>
    </AdminShell>
  );
}
