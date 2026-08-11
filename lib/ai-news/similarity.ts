import { normalizeTitle } from "@/lib/ai-news/text";

function words(text: string) {
  return normalizeTitle(text).split(" ").filter(Boolean);
}

function ngrams(text: string, n = 5) {
  const tokens = words(text);
  const result = new Set<string>();
  for (let i = 0; i <= tokens.length - n; i += 1) result.add(tokens.slice(i, i + n).join(" "));
  return result;
}

export function similarityRisk(generated: string, sourceTexts: string[]) {
  const generatedNgrams = ngrams(generated, 5);
  if (!generatedNgrams.size) return { score: 0, matchedPhrases: [] as string[] };
  const matches = new Set<string>();
  for (const source of sourceTexts) {
    const sourceNgrams = ngrams(source, 5);
    for (const phrase of generatedNgrams) if (sourceNgrams.has(phrase)) matches.add(phrase);
  }
  const score = Math.min(100, Math.round((matches.size / generatedNgrams.size) * 100));
  return { score, matchedPhrases: [...matches].slice(0, 12) };
}
