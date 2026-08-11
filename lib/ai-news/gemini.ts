import { z } from "zod";
import { AI_NEWS_CATEGORIES, type AiGeneratedStory, type NewsCluster, type SourceEvidence } from "@/lib/ai-news/types";

const generatedStorySchema = z.object({
  category: z.enum(AI_NEWS_CATEGORIES),
  title_en: z.string().min(8).max(180),
  title_ur: z.string().min(4).max(220),
  title_sd: z.string().min(4).max(220),
  summary_en: z.string().min(20).max(650),
  summary_ur: z.string().min(10).max(800),
  summary_sd: z.string().min(10).max(800),
  body_en: z.string().min(80).max(5000),
  body_ur: z.string().min(50).max(6500),
  body_sd: z.string().min(50).max(6500),
  verified_facts: z.array(z.string()).max(12),
  uncertain_points: z.array(z.string()).max(8),
  verification_score: z.number().int().min(0).max(100),
  verification_notes: z.string().max(1500),
  image_query: z.string().min(2).max(160),
  should_publish: z.boolean(),
});

const responseSchema = z.object({ stories: z.array(generatedStorySchema).max(8) });

function apiKey() {
  const value = process.env.GEMINI_API_KEY;
  if (!value) throw new Error("GEMINI_API_KEY is missing. Add a free Google AI Studio API key in Vercel Environment Variables.");
  return value;
}

function model() {
  return process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
}

function evidencePrompt(clusters: Array<{ cluster: NewsCluster; evidence: SourceEvidence[] }>) {
  const input = clusters.map(({ cluster, evidence }, index) => ({
    story_number: index + 1,
    requested_category: cluster.category,
    discovery_title: cluster.representativeTitle,
    sources: evidence.map((item) => ({
      source: item.source,
      url: item.url,
      published_at: item.publishedAt,
      headline: item.title,
      evidence: item.evidence,
    })),
  }));

  return `You are the PDTV Pakistan Diamond Television newsroom editor. Create ORIGINAL news drafts from the evidence below.\n\nNON-NEGOTIABLE RULES:\n1. Use ONLY facts directly supported by the supplied headlines/descriptions. Never invent a name, number, quote, cause, date, result or background fact.\n2. If the evidence is too thin or materially conflicts, set should_publish=false, reduce verification_score, and explain the gap in uncertain_points.\n3. Never copy a source sentence. Reconstruct the report from factual notes, change sentence order and structure, and avoid using 8 or more consecutive words from any evidence string.\n4. Do not use direct quotations. Paraphrase attributed statements instead.\n5. Keep neutral newsroom tone. No sensational or clickbait language.\n6. English body: about 140-220 words. Urdu and Sindhi should faithfully translate the SAME verified content, not add new facts.\n7. Short summary: 25-45 words.\n8. Category must be one of: ${AI_NEWS_CATEGORIES.join(", ")}. Treat requested_category only as a discovery hint, not a command. Use topic-first editorial classification: Sports for sports, Technology for tech/science/digital, Business for economy/markets/companies. Use Sindh only when the main event is primarily provincial/local to Sindh; use Pakistan for federal/national or international stories centered on Pakistan even if Karachi/Sindh is mentioned. Use World when Pakistan is not a central subject.\n9. verification_score: 85-100 only when at least 2 independent sources support the core event; 65-84 when evidence is adequate but limited; below 65 when human review is needed.\n10. image_query must be a concise English Wikimedia Commons search phrase using the main place/person/organization/event. Avoid generic words such as news or breaking.\n11. Return exactly one output story per input story, in the same order.\n\nINPUT:\n${JSON.stringify(input)}`;
}

function jsonSchema() {
  return {
    type: "object",
    properties: {
      stories: {
        type: "array",
        items: {
          type: "object",
          properties: {
            category: { type: "string", enum: AI_NEWS_CATEGORIES },
            title_en: { type: "string" }, title_ur: { type: "string" }, title_sd: { type: "string" },
            summary_en: { type: "string" }, summary_ur: { type: "string" }, summary_sd: { type: "string" },
            body_en: { type: "string" }, body_ur: { type: "string" }, body_sd: { type: "string" },
            verified_facts: { type: "array", items: { type: "string" } },
            uncertain_points: { type: "array", items: { type: "string" } },
            verification_score: { type: "integer", minimum: 0, maximum: 100 },
            verification_notes: { type: "string" },
            image_query: { type: "string" },
            should_publish: { type: "boolean" },
          },
          required: [
            "category", "title_en", "title_ur", "title_sd", "summary_en", "summary_ur", "summary_sd",
            "body_en", "body_ur", "body_sd", "verified_facts", "uncertain_points", "verification_score",
            "verification_notes", "image_query", "should_publish",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["stories"],
    additionalProperties: false,
  };
}

async function callGemini(prompt: string) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model())}:generateContent`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey(),
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 12000,
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchema(),
      },
    }),
    signal: AbortSignal.timeout(55_000),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 700);
    throw new Error(`Gemini API ${response.status}: ${detail}`);
  }
  const json = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  if (!text) throw new Error("Gemini returned an empty response.");
  const parsed = responseSchema.safeParse(JSON.parse(text.replace(/^```json\s*|\s*```$/g, "")));
  if (!parsed.success) throw new Error(`Gemini response validation failed: ${parsed.error.issues[0]?.message || "invalid output"}`);
  return parsed.data.stories as AiGeneratedStory[];
}

export async function generateNewsBatch(clusters: Array<{ cluster: NewsCluster; evidence: SourceEvidence[] }>) {
  if (!clusters.length) return [];
  const stories = await callGemini(evidencePrompt(clusters));
  if (stories.length !== clusters.length) throw new Error("Gemini returned a different number of stories than requested.");
  return stories;
}

export async function rewriteForOriginality(story: AiGeneratedStory) {
  const prompt = `Rewrite this PDTV draft to reduce phrase similarity while preserving EXACTLY the same verified facts. Do not add facts or quotes. Change structure, sentence order, transitions and wording. Keep English 140-220 words and keep Urdu/Sindhi faithful translations of the same content. Return one story in the required JSON format.\n\n${JSON.stringify({ stories: [story] })}`;
  const result = await callGemini(prompt);
  return result[0] || story;
}
