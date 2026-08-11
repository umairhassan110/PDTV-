import type { AiNewsCategory } from "@/lib/ai-news/types";

const locale = "hl=en-PK&gl=PK&ceid=PK:en";

export const googleNewsFeeds: Array<{
  category: AiNewsCategory;
  url: string;
}> = [
  {
    category: "Pakistan",
    url: `https://news.google.com/rss/search?q=${encodeURIComponent("Pakistan when:1d")}&${locale}`,
  },
  {
    category: "Sindh",
    url: `https://news.google.com/rss/search?q=${encodeURIComponent("(Sindh OR Karachi OR Hyderabad) Pakistan when:1d")}&${locale}`,
  },
  {
    category: "World",
    url: `https://news.google.com/rss/headlines/section/topic/WORLD?${locale}`,
  },
  {
    category: "Business",
    url: `https://news.google.com/rss/headlines/section/topic/BUSINESS?${locale}`,
  },
  {
    category: "Sports",
    url: `https://news.google.com/rss/headlines/section/topic/SPORTS?${locale}`,
  },
  {
    category: "Technology",
    url: `https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?${locale}`,
  },
];

export const gdeltQueries: Array<{
  category: AiNewsCategory;
  query: string;
}> = [
  { category: "Pakistan", query: "Pakistan" },
  { category: "Sindh", query: "(Sindh OR Karachi OR Hyderabad)" },
  { category: "World", query: "(election OR government OR conflict OR diplomacy OR disaster)" },
  { category: "Business", query: "(business OR economy OR markets OR inflation OR company)" },
  { category: "Sports", query: "(cricket OR football OR tennis OR sports)" },
  { category: "Technology", query: "(technology OR artificial intelligence OR cybersecurity OR software)" },
];
