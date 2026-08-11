import { createHash } from "node:crypto";
import { gdeltQueries, googleNewsFeeds } from "@/lib/ai-news/sources";
import { compactText, decodeHtml, normalizeTitle, stripHtml } from "@/lib/ai-news/text";
import type { AiNewsCategory, NewsCluster, NewsSourceItem } from "@/lib/ai-news/types";

const USER_AGENT = "PDTV-Newsroom/1.0 (+https://www.pdtv.me)";
const GOOGLE_LOCALE = "hl=en-PK&gl=PK&ceid=PK:en";
const DAY_MS = 24 * 60 * 60 * 1000;
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "from", "with", "at", "by", "as", "is", "are", "was", "were", "be", "has", "have", "had", "will", "after", "before", "over", "amid", "new", "latest", "says", "say", "report", "reports", "news", "live",
]);

function fetchWithTimeout(url: string, ms = 9000) {
  return fetch(url, {
    headers: { "user-agent": USER_AGENT, accept: "application/json, application/rss+xml, application/xml, text/xml, text/html;q=0.8" },
    redirect: "follow",
    signal: AbortSignal.timeout(ms),
    cache: "no-store",
  });
}

function tag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match ? decodeHtml(match[1]).trim() : "";
}

function attr(block: string, name: string, attrName: string) {
  const match = block.match(new RegExp(`<${name}[^>]*\\s${attrName}=["']([^"']+)["'][^>]*>`, "i"));
  return match ? decodeHtml(match[1]).trim() : "";
}

function parseGoogleRss(xml: string, category: AiNewsCategory): NewsSourceItem[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  return items.slice(0, 35).flatMap((block) => {
    const rawTitle = stripHtml(tag(block, "title"));
    const link = tag(block, "link");
    const sourceTag = tag(block, "source");
    const sourceUrl = attr(block, "source", "url");
    const description = compactText(tag(block, "description"), 650);
    const pubDate = tag(block, "pubDate");
    if (!rawTitle || !link) return [];
    const suffix = rawTitle.match(/\s+-\s+([^-]{2,80})$/)?.[1]?.trim();
    const source = sourceTag || suffix || "Google News source";
    const title = suffix ? rawTitle.replace(new RegExp(`\\s+-\\s+${suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), "").trim() : rawTitle;
    return [{
      title,
      url: link,
      source,
      publishedAt: pubDate && !Number.isNaN(Date.parse(pubDate)) ? new Date(pubDate).toISOString() : null,
      category,
      description,
      domain: sourceUrl ? safeDomain(sourceUrl) : undefined,
      origin: "google-rss" as const,
    }];
  });
}

function safeDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function sourceIdentity(item: NewsSourceItem) {
  return (item.domain || item.source).toLowerCase().replace(/^www\./, "").trim();
}

function uniqueSources(items: NewsSourceItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = sourceIdentity(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function collectGoogleRss() {
  const settled = await Promise.allSettled(
    googleNewsFeeds.map(async ({ category, url }) => {
      const response = await fetchWithTimeout(url);
      if (!response.ok) throw new Error(`Google News RSS ${category}: ${response.status}`);
      return parseGoogleRss(await response.text(), category);
    }),
  );
  return settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

type GdeltArticle = {
  url?: string;
  title?: string;
  seendate?: string;
  domain?: string;
  language?: string;
};

async function collectGdelt() {
  const settled = await Promise.allSettled(
    gdeltQueries.map(async ({ category, query }) => {
      const params = new URLSearchParams({
        query,
        mode: "artlist",
        maxrecords: "35",
        timespan: "36h",
        sort: "datedesc",
        format: "json",
      });
      const response = await fetchWithTimeout(`https://api.gdeltproject.org/api/v2/doc/doc?${params}`);
      if (!response.ok) throw new Error(`GDELT ${category}: ${response.status}`);
      const json = (await response.json()) as { articles?: GdeltArticle[] };
      return (json.articles || []).flatMap((article): NewsSourceItem[] => {
        const title = compactText(article.title || "", 220);
        const url = article.url || "";
        if (!title || !url) return [];
        const domain = article.domain || safeDomain(url) || "Unknown source";
        const date = article.seendate ? Date.parse(article.seendate.replace(" ", "T")) : NaN;
        return [{
          title,
          url,
          source: domain,
          publishedAt: Number.isNaN(date) ? null : new Date(date).toISOString(),
          category,
          domain,
          origin: "gdelt",
        }];
      });
    }),
  );
  return settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

function tokens(title: string) {
  return normalizeTitle(title)
    .split(" ")
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word));
}

function jaccard(a: string, b: string) {
  const aa = new Set(tokens(a));
  const bb = new Set(tokens(b));
  if (!aa.size || !bb.size) return 0;
  let intersection = 0;
  for (const item of aa) if (bb.has(item)) intersection += 1;
  return intersection / (aa.size + bb.size - intersection);
}

function sharedTokenCount(a: string, b: string) {
  const aa = new Set(tokens(a));
  return new Set(tokens(b).filter((word) => aa.has(word))).size;
}

function dedupe(items: NewsSourceItem[]) {
  const seen = new Set<string>();
  const cutoff = Date.now() - 2 * DAY_MS;
  return items.filter((item) => {
    if (item.publishedAt && Date.parse(item.publishedAt) < cutoff) return false;
    const key = `${normalizeTitle(item.title)}|${sourceIdentity(item)}`;
    if (!normalizeTitle(item.title) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fingerprint(category: AiNewsCategory, items: NewsSourceItem[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const word of new Set(tokens(item.title))) counts.set(word, (counts.get(word) || 0) + 1);
  }
  const keyWords = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 9)
    .map(([word]) => word)
    .sort();
  const day = new Date(items.map((item) => item.publishedAt ? Date.parse(item.publishedAt) : Date.now()).sort((a, b) => b - a)[0] || Date.now())
    .toISOString().slice(0, 10);
  return createHash("sha256").update(`${category}|${day}|${keyWords.join("|")}`).digest("hex");
}

export function clusterItems(allItems: NewsSourceItem[]): NewsCluster[] {
  const byCategory = new Map<AiNewsCategory, NewsSourceItem[]>();
  for (const item of dedupe(allItems)) {
    const list = byCategory.get(item.category) || [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  const clusters: NewsCluster[] = [];
  for (const [category, items] of byCategory) {
    const categoryClusters: NewsSourceItem[][] = [];
    for (const item of items.sort((a, b) => (Date.parse(b.publishedAt || "") || 0) - (Date.parse(a.publishedAt || "") || 0))) {
      const existing = categoryClusters.find((cluster) => cluster.some((member) => jaccard(member.title, item.title) >= 0.42));
      if (existing) {
        if (!existing.some((member) => sourceIdentity(member) === sourceIdentity(item))) existing.push(item);
      } else {
        categoryClusters.push([item]);
      }
    }

    for (const itemsInCluster of categoryClusters) {
      const distinctSources = uniqueSources(itemsInCluster).length;
      const newest = itemsInCluster
        .map((item) => item.publishedAt)
        .filter(Boolean)
        .sort()
        .at(-1) || null;
      const ageHours = newest ? Math.max(0, (Date.now() - Date.parse(newest)) / 3_600_000) : 24;
      const score = distinctSources * 25 + Math.max(0, 30 - ageHours) + Math.min(20, itemsInCluster.length * 3);
      clusters.push({
        category,
        representativeTitle: itemsInCluster[0].title,
        fingerprint: fingerprint(category, itemsInCluster),
        items: uniqueSources(itemsInCluster).slice(0, 6),
        newestAt: newest,
        score,
      });
    }
  }

  // Topic-first categories beat geography. Pakistan beats Sindh for national,
  // federal or international stories that merely mention Karachi/Sindh.
  const priority: Record<AiNewsCategory, number> = {
    Sports: 7, Technology: 7, Business: 7, Pakistan: 5, Sindh: 4, World: 2,
  };
  const sorted = clusters.sort((a, b) => b.score - a.score);
  const unique: NewsCluster[] = [];
  for (const cluster of sorted) {
    const duplicateIndex = unique.findIndex((existing) => jaccard(existing.representativeTitle, cluster.representativeTitle) >= 0.55);
    if (duplicateIndex === -1) {
      unique.push(cluster);
      continue;
    }
    const existing = unique[duplicateIndex];
    const winner = priority[cluster.category] > priority[existing.category]
      ? cluster
      : priority[cluster.category] < priority[existing.category]
        ? existing
        : cluster.score > existing.score ? cluster : existing;
    const mergedItems = uniqueSources([...existing.items, ...cluster.items]).slice(0, 8);
    unique[duplicateIndex] = {
      ...winner,
      items: mergedItems,
      fingerprint: fingerprint(winner.category, mergedItems),
      score: Math.max(existing.score, cluster.score) + Math.min(12, mergedItems.length * 2),
    };
  }
  return unique.sort((a, b) => b.score - a.score);
}

export async function discoverNews() {
  const [gdelt, google] = await Promise.all([collectGdelt(), collectGoogleRss()]);
  return clusterItems([...gdelt, ...google]);
}

async function findCorroboratingSources(cluster: NewsCluster) {
  const queryWords = tokens(cluster.representativeTitle).slice(0, 7);
  if (queryWords.length < 2) return [];
  const query = `${queryWords.join(" ")} when:2d`;
  try {
    const response = await fetchWithTimeout(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&${GOOGLE_LOCALE}`, 8000);
    if (!response.ok) return [];
    return parseGoogleRss(await response.text(), cluster.category).filter((item) => {
      const similarity = jaccard(cluster.representativeTitle, item.title);
      return similarity >= 0.28 || sharedTokenCount(cluster.representativeTitle, item.title) >= 3;
    });
  } catch {
    return [];
  }
}

function metaContent(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`, "i"),
  ];
  for (const pattern of patterns) {
    const found = html.match(pattern)?.[1];
    if (found) return compactText(found, 900);
  }
  return "";
}

export async function enrichCluster(cluster: NewsCluster) {
  let sourceItems = uniqueSources(cluster.items);
  if (sourceItems.length < 3) {
    const corroborating = await findCorroboratingSources(cluster);
    sourceItems = uniqueSources([...sourceItems, ...corroborating]);
  }
  const items = sourceItems.slice(0, 5);
  const settled = await Promise.allSettled(items.map(async (item) => {
    let evidence = compactText(item.description || item.title, 900);
    if (item.origin === "gdelt") {
      try {
        const response = await fetchWithTimeout(item.url, 6500);
        const type = response.headers.get("content-type") || "";
        if (response.ok && type.includes("text/html")) {
          const html = (await response.text()).slice(0, 700_000);
          const description = metaContent(html, "description") || metaContent(html, "og:description") || metaContent(html, "twitter:description");
          if (description && description.toLowerCase() !== item.title.toLowerCase()) evidence = description;
        }
      } catch {
        // Source metadata is optional; the title remains usable evidence.
      }
    }
    return { ...item, evidence };
  }));
  return settled.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
}
