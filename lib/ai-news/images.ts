import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeTitle, stripHtml } from "@/lib/ai-news/text";
import type { LicensedImage } from "@/lib/ai-news/types";

const ALLOWED_LICENSE_MARKERS = ["cc by", "cc-by", "cc by-sa", "cc-by-sa", "cc0", "public domain", "pd-old", "pd-us"];

function plain(value: unknown) {
  return stripHtml(String(value || "")).replace(/\s+/g, " ").trim();
}

function isAllowedLicense(value: string) {
  const normalized = value.toLowerCase();
  return ALLOWED_LICENSE_MARKERS.some((marker) => normalized.includes(marker));
}

function overlapScore(a: string, b: string) {
  const aa = new Set(normalizeTitle(a).split(" ").filter((x) => x.length > 2));
  const bb = new Set(normalizeTitle(b).split(" ").filter((x) => x.length > 2));
  if (!aa.size || !bb.size) return 0;
  let matches = 0;
  for (const word of aa) if (bb.has(word)) matches += 1;
  return matches / Math.min(aa.size, bb.size);
}

export async function findLicensedImage(query: string): Promise<LicensedImage | null> {
  if (!query.trim()) return null;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrnamespace: "6",
    gsrsearch: query,
    gsrlimit: "10",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1400",
  });

  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { "user-agent": "PDTV-Newsroom/1.0 (+https://www.pdtv.me)" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const json = await response.json() as {
    query?: { pages?: Record<string, { title?: string; imageinfo?: Array<{ thumburl?: string; url?: string; descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }> }> };
  };
  const pages = Object.values(json.query?.pages || {});
  const candidates = pages.flatMap((page) => {
    const info = page.imageinfo?.[0];
    if (!info) return [];
    const meta = info.extmetadata || {};
    const license = plain(meta.LicenseShortName?.value || meta.UsageTerms?.value);
    const author = plain(meta.Artist?.value || meta.Credit?.value || "Wikimedia Commons contributor");
    const licenseUrl = plain(meta.LicenseUrl?.value) || null;
    const imageUrl = info.thumburl || info.url || "";
    const sourceUrl = info.descriptionurl || "";
    const title = plain(page.title || "").replace(/^File:/i, "");
    if (!imageUrl || !sourceUrl || !license || !isAllowedLicense(license)) return [];
    return [{ imageUrl, sourceUrl, author, license, licenseUrl, title, isIllustrative: true, score: overlapScore(query, title) }];
  }).sort((a, b) => b.score - a.score);
  const best = candidates.find((candidate) => candidate.score >= 0.18) || candidates[0];
  if (!best) return null;
  const { score: _score, ...image } = best;
  return image;
}

export async function cacheLicensedImage(image: LicensedImage, draftId: string) {
  try {
    const response = await fetch(image.imageUrl, {
      headers: { "user-agent": "PDTV-Newsroom/1.0 (+https://www.pdtv.me)" },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.startsWith("image/")) return image.imageUrl;
    const data = await response.arrayBuffer();
    if (data.byteLength > 5 * 1024 * 1024) return image.imageUrl;
    const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const path = `ai-news/${draftId}.${extension}`;
    const admin = createAdminClient();
    const { error } = await admin.storage.from("news-images").upload(path, data, { contentType, upsert: true });
    if (error) return image.imageUrl;
    return admin.storage.from("news-images").getPublicUrl(path).data.publicUrl;
  } catch {
    return image.imageUrl;
  }
}
