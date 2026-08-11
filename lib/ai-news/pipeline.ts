import { createAdminClient } from "@/lib/supabase/admin";
import { discoverNews, enrichCluster } from "@/lib/ai-news/discovery";
import { generateNewsBatch, rewriteForOriginality } from "@/lib/ai-news/gemini";
import { cacheLicensedImage, findLicensedImage } from "@/lib/ai-news/images";
import { similarityRisk } from "@/lib/ai-news/similarity";
import { AI_NEWS_CATEGORIES, type NewsCluster, type SourceEvidence } from "@/lib/ai-news/types";

const DEFAULT_MAX = 4;

function maxStories() {
  const parsed = Number(process.env.MAX_AI_STORIES_PER_RUN || DEFAULT_MAX);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(8, Math.floor(parsed))) : DEFAULT_MAX;
}

async function recentFingerprints() {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin.from("ai_news_drafts").select("fingerprint").gte("created_at", since).limit(1000);
  return new Set((data || []).map((row) => row.fingerprint as string));
}

function selectClusters(clusters: NewsCluster[], existing: Set<string>) {
  const candidates = clusters.filter((cluster) => !existing.has(cluster.fingerprint));
  const picked: NewsCluster[] = [];
  const halfHour = Math.floor(Date.now() / (30 * 60 * 1000));
  const rotation = halfHour % AI_NEWS_CATEGORIES.length;
  const categoryOrder = [...AI_NEWS_CATEGORIES.slice(rotation), ...AI_NEWS_CATEGORIES.slice(0, rotation)];
  for (const category of categoryOrder) {
    const candidate = candidates.find((cluster) => cluster.category === category && !picked.includes(cluster));
    if (candidate) picked.push(candidate);
    if (picked.length >= maxStories()) return picked;
  }
  for (const cluster of candidates) {
    if (!picked.includes(cluster)) picked.push(cluster);
    if (picked.length >= maxStories()) break;
  }
  return picked;
}

async function insertDraft(
  cluster: NewsCluster,
  evidence: SourceEvidence[],
  generated: Awaited<ReturnType<typeof generateNewsBatch>>[number],
) {
  const admin = createAdminClient();
  let finalStory = generated;
  const sourceTexts = evidence.flatMap((item) => [item.title, item.evidence]).filter(Boolean);
  let similarity = similarityRisk(`${generated.title_en}\n${generated.summary_en}\n${generated.body_en}`, sourceTexts);
  if (similarity.score > 18) {
    finalStory = await rewriteForOriginality(generated);
    similarity = similarityRisk(`${finalStory.title_en}\n${finalStory.summary_en}\n${finalStory.body_en}`, sourceTexts);
  }

  const draftId = crypto.randomUUID();
  const image = await findLicensedImage(finalStory.image_query);
  const imageUrl = image ? await cacheLicensedImage(image, draftId) : null;
  const independentSources = new Set(evidence.map((item) => item.source.toLowerCase())).size;
  const sourceScoreCap = independentSources >= 3 ? 96 : independentSources === 2 ? 88 : 60;
  const verificationScore = Math.min(finalStory.verification_score, sourceScoreCap);
  const riskFlags = [
    ...(!finalStory.should_publish ? ["AI evidence check marked this story as not ready for normal publication."] : []),
    ...(independentSources < 2 ? ["Only one independent source was available."] : []),
    ...(similarity.score > 18 ? [`Text similarity remains ${similarity.score}%.`] : []),
    ...finalStory.uncertain_points,
    ...(!image ? ["No suitable license-cleared Wikimedia image was found; PDTV fallback artwork will be used."] : []),
  ];
  const ready = finalStory.should_publish && verificationScore >= 75 && independentSources >= 2 && similarity.score <= 18;

  const sourceLinks = evidence.map((item) => ({
    name: item.source,
    url: item.url,
    headline: item.title,
    published_at: item.publishedAt,
  }));

  const { error } = await admin.from("ai_news_drafts").insert({
    id: draftId,
    fingerprint: cluster.fingerprint,
    category: finalStory.category,
    discovery_title: cluster.representativeTitle,
    source_items: sourceLinks,
    verified_facts: finalStory.verified_facts,
    uncertain_points: finalStory.uncertain_points,
    title_en: finalStory.title_en,
    title_ur: finalStory.title_ur,
    title_sd: finalStory.title_sd,
    summary_en: finalStory.summary_en,
    summary_ur: finalStory.summary_ur,
    summary_sd: finalStory.summary_sd,
    body_en: finalStory.body_en,
    body_ur: finalStory.body_ur,
    body_sd: finalStory.body_sd,
    verification_score: verificationScore,
    verification_notes: finalStory.verification_notes,
    similarity_score: similarity.score,
    similarity_phrases: similarity.matchedPhrases,
    risk_flags: riskFlags,
    image_query: finalStory.image_query,
    image_url: imageUrl,
    image_source_url: image?.sourceUrl || null,
    image_author: image?.author || null,
    image_license: image?.license || null,
    image_license_url: image?.licenseUrl || null,
    image_is_illustrative: image?.isIllustrative ?? false,
    status: ready ? "ready" : "needs_review",
  });
  if (error) throw error;
  return ready;
}

export async function runAiNewsroom() {
  const admin = createAdminClient();
  const activeSince = new Date(Date.now() - 12 * 60 * 1000).toISOString();
  const { data: activeRun } = await admin.from("ai_news_runs").select("id,started_at").eq("status", "running").gte("started_at", activeSince).order("started_at", { ascending: false }).limit(1).maybeSingle();
  if (activeRun) {
    return { runId: activeRun.id as string, discovered: 0, selected: 0, ready: 0, needsReview: 0, errors: ["A recent AI Newsroom run is still active; duplicate run skipped."] };
  }

  const runId = crypto.randomUUID();
  const { error: runInsertError } = await admin.from("ai_news_runs").insert({ id: runId, status: "running", started_at: new Date().toISOString() });
  if (runInsertError) throw runInsertError;
  let discovered = 0;
  let selected = 0;
  let ready = 0;
  let needsReview = 0;
  const errors: string[] = [];

  try {
    const clusters = await discoverNews();
    discovered = clusters.length;
    const existing = await recentFingerprints();
    const chosen = selectClusters(clusters, existing);
    selected = chosen.length;
    if (!chosen.length) {
      await admin.from("ai_news_runs").update({ status: "completed", completed_at: new Date().toISOString(), discovered, selected, ready, needs_review: needsReview, errors }).eq("id", runId);
      return { runId, discovered, selected, ready, needsReview, errors };
    }

    const enrichedSettled = await Promise.allSettled(chosen.map(async (cluster) => ({ cluster, evidence: await enrichCluster(cluster) })));
    const enriched = enrichedSettled.flatMap((result) => {
      if (result.status === "fulfilled" && result.value.evidence.length) return [result.value];
      if (result.status === "rejected") errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
      return [];
    });
    if (!enriched.length) throw new Error("No source evidence could be collected for the selected stories.");

    const generated = await generateNewsBatch(enriched);
    const draftResults = await Promise.allSettled(
      enriched.map((item, index) => insertDraft(item.cluster, item.evidence, generated[index])),
    );
    for (const result of draftResults) {
      if (result.status === "fulfilled") {
        if (result.value) ready += 1;
        else needsReview += 1;
      } else {
        errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    }

    await admin.from("ai_news_runs").update({ status: errors.length ? "completed_with_errors" : "completed", completed_at: new Date().toISOString(), discovered, selected, ready, needs_review: needsReview, errors }).eq("id", runId);
    return { runId, discovered, selected, ready, needsReview, errors };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    await admin.from("ai_news_runs").update({ status: "failed", completed_at: new Date().toISOString(), discovered, selected, ready, needs_review: needsReview, errors }).eq("id", runId);
    throw error;
  }
}
