export const AI_NEWS_CATEGORIES = [
  "Pakistan",
  "Sindh",
  "World",
  "Business",
  "Sports",
  "Technology",
] as const;

export type AiNewsCategory = (typeof AI_NEWS_CATEGORIES)[number];

export type NewsSourceItem = {
  title: string;
  url: string;
  source: string;
  publishedAt: string | null;
  category: AiNewsCategory;
  description?: string;
  domain?: string;
  origin: "gdelt" | "google-rss";
};

export type NewsCluster = {
  category: AiNewsCategory;
  representativeTitle: string;
  fingerprint: string;
  items: NewsSourceItem[];
  newestAt: string | null;
  score: number;
};

export type SourceEvidence = NewsSourceItem & {
  evidence: string;
};

export type AiGeneratedStory = {
  category: AiNewsCategory;
  title_en: string;
  title_ur: string;
  title_sd: string;
  summary_en: string;
  summary_ur: string;
  summary_sd: string;
  body_en: string;
  body_ur: string;
  body_sd: string;
  verified_facts: string[];
  uncertain_points: string[];
  verification_score: number;
  verification_notes: string;
  image_query: string;
  should_publish: boolean;
};

export type LicensedImage = {
  imageUrl: string;
  sourceUrl: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  title: string;
  isIllustrative: boolean;
};
