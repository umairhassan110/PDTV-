export type Language = "en" | "ur" | "sd";

export type Story = {
  id: string;
  slug: string;

  title_en: string;
  title_ur: string;
  title_sd: string;

  summary_en: string;
  summary_ur: string;
  summary_sd: string;

  body_en: string;
  body_ur: string;
  body_sd: string;

  category: string;
  author: string;
  image_url: string | null;
  image_credit?: string | null;
  image_source_url?: string | null;
  image_license?: string | null;
  image_license_url?: string | null;
  image_is_illustrative?: boolean;
  source_links?: Array<{ name: string; url: string; headline?: string; published_at?: string | null }>;

  status: "draft" | "published";

  is_breaking: boolean;
  is_lead: boolean;

  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string;
  role: "owner" | "editor";
  active: boolean;
  created_at: string;
};

export const languageInfo: Record<
  Language,
  {
    label: string;
    native: string;
    dir: "ltr" | "rtl";
  }
> = {
  en: {
    label: "English",
    native: "English",
    dir: "ltr",
  },

  ur: {
    label: "Urdu",
    native: "اردو",
    dir: "rtl",
  },

  sd: {
    label: "Sindhi",
    native: "سنڌي",
    dir: "rtl",
  },
};

export function readLanguage(value?: string): Language {
  if (value === "en") return "en";
  if (value === "ur") return "ur";
  return "sd";
}

export function storyText(
  story: Story,
  lang: Language
) {
  return {
    title: story[`title_${lang}`],
    summary: story[`summary_${lang}`],
    body: story[`body_${lang}`],
  };
}

const categoryTranslations: Record<
  string,
  Record<Language, string>
> = {
  Pakistan: {
    en: "Pakistan",
    ur: "پاکستان",
    sd: "پاڪستان",
  },

  Sindh: {
    en: "Sindh",
    ur: "سندھ",
    sd: "سنڌ",
  },

  World: {
    en: "World",
    ur: "دنیا",
    sd: "دنيا",
  },

  Politics: {
    en: "Politics",
    ur: "سیاست",
    sd: "سياست",
  },

  Sports: {
    en: "Sports",
    ur: "کھیل",
    sd: "رانديون",
  },

  Business: {
    en: "Business",
    ur: "کاروبار",
    sd: "ڪاروبار",
  },

  Technology: {
    en: "Technology",
    ur: "ٹیکنالوجی",
    sd: "ٽيڪنالاجي",
  },

  Education: {
    en: "Education",
    ur: "تعلیم",
    sd: "تعليم",
  },

  Entertainment: {
    en: "Entertainment",
    ur: "تفریح",
    sd: "وندر",
  },

  Health: {
    en: "Health",
    ur: "صحت",
    sd: "صحت",
  },
};

export function categoryText(
  category: string,
  language: Language
) {
  return (
    categoryTranslations[category]?.[language] ||
    category
  );
}

export function languageLocale(
  language: Language
) {
  if (language === "ur") return "ur-PK";
  if (language === "sd") return "sd-PK";
  return "en-PK";
}

export function formatPublishedDate(
  value: string,
  language: Language
) {
  return new Intl.DateTimeFormat(
    languageLocale(language),
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(new Date(value));
}