import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  UserRound,
} from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { storyBySlug } from "@/lib/data";

import {
  categoryText,
  formatPublishedDate,
  languageLocale,
  readLanguage,
  storyText,
} from "@/lib/types";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.pdtv.me"
).replace(/\/$/, "");

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    lang?: string;
  }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { lang: requestedLang } = await searchParams;

  const lang = readLanguage(requestedLang);
  const story = await storyBySlug(slug);

  if (!story) {
    return {
      title: "Story not found | PDTV",
      description: "The requested PDTV news story could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const text = storyText(story, lang);

  const canonicalUrl =
    `${SITE_URL}/news/${encodeURIComponent(story.slug)}` +
    `?lang=${lang}`;

  const imageUrl = story.image_url || `${SITE_URL}/pdtv-logo.png`;

  const isPublished = story.status === "published";

  return {
    title: text.title,
    description: text.summary,

    alternates: {
      canonical: canonicalUrl,

      languages: {
        en: `${SITE_URL}/news/${encodeURIComponent(story.slug)}?lang=en`,
        ur: `${SITE_URL}/news/${encodeURIComponent(story.slug)}?lang=ur`,
        sd: `${SITE_URL}/news/${encodeURIComponent(story.slug)}?lang=sd`,
      },
    },

    openGraph: {
      type: "article",
      url: canonicalUrl,
      siteName: "PDTV",
      locale: languageLocale(lang),

      title: text.title,
      description: text.summary,

      images: [
        {
          url: imageUrl,
          alt: text.title,
        },
      ],

      publishedTime: story.published_at || undefined,

      modifiedTime:
        story.updated_at ||
        story.published_at ||
        undefined,

      authors: [story.author || "PDTV News Desk"],

      section: categoryText(story.category, lang),
    },

    twitter: {
      card: "summary_large_image",
      title: text.title,
      description: text.summary,
      images: [imageUrl],
    },

    robots: {
      index: isPublished,
      follow: isPublished,

      googleBot: {
        index: isPublished,
        follow: isPublished,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function NewsPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { lang: requestedLang } = await searchParams;

  const lang = readLanguage(requestedLang);
  const story = await storyBySlug(slug);

  if (!story) {
    notFound();
  }

  // Public news pages should not expose drafts.
  // Supabase RLS should also prevent public access
  // to unpublished stories.
  if (story.status !== "published") {
    notFound();
  }

  const text = storyText(story, lang);

  const isRtl = lang === "ur" || lang === "sd";

  const storySlug = encodeURIComponent(story.slug);

  const canonicalUrl = `${SITE_URL}/news/${storySlug}?lang=${lang}`;

  const articleImage =
    story.image_url || `${SITE_URL}/pdtv-logo.png`;

  const publishedDate = story.published_at
    ? formatPublishedDate(story.published_at, lang)
    : null;

  const paragraphs = text.body
    .split(/\r?\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const wordCount = text.body
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;

  const structuredData = {
    "@context": "https://schema.org",

    "@type": "NewsArticle",

    "@id": `${canonicalUrl}#article`,

    url: canonicalUrl,

    headline: text.title,

    description: text.summary,

    image: [articleImage],

    datePublished:
      story.published_at || story.created_at,

    dateModified:
      story.updated_at ||
      story.published_at ||
      story.created_at,

    author: {
      "@type": "Organization",
      name: story.author || "PDTV News Desk",
      url: SITE_URL,
    },

    publisher: {
      "@type": "NewsMediaOrganization",

      name: "PDTV Pakistan Diamond Television",

      url: SITE_URL,

      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/pdtv-logo.png`,
      },
    },

    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },

    articleSection: categoryText(
      story.category,
      lang
    ),

    inLanguage: languageLocale(lang),

    wordCount,

    isAccessibleForFree: true,

    isPartOf: {
      "@type": "WebSite",
      name: "PDTV",
      url: SITE_URL,
    },

    citation:
      story.source_links?.map(
        (source) => source.url
      ) || [],
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      lang={lang}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <header className="article-header">
        <div className="shell article-nav">
          <Logo language={lang} />

          <LanguageSwitcher language={lang} />
        </div>
      </header>

      <main className="article-shell">
        <Link
          className="back-link"
          href={`/?lang=${lang}`}
        >
          <ArrowLeft
            size={16}
            aria-hidden="true"
            style={{
              transform: isRtl
                ? "rotate(180deg)"
                : undefined,
            }}
          />

          <span>
            {lang === "en"
              ? "Back to PDTV"
              : lang === "ur"
                ? "پی ڈی ٹی وی پر واپس جائیں"
                : "پي ڊي ٽي وي ڏانهن واپس وڃو"}
          </span>
        </Link>

        <div className="article-category">
          {categoryText(story.category, lang)}
        </div>

        <h1>{text.title}</h1>

        {text.summary && (
          <p className="article-summary">
            {text.summary}
          </p>
        )}

        <div className="article-meta">
          <span>
            <UserRound
              size={15}
              aria-hidden="true"
            />

            {story.author || "PDTV News Desk"}
          </span>

          {publishedDate && (
            <span>
              <CalendarDays
                size={15}
                aria-hidden="true"
              />

              {publishedDate}
            </span>
          )}
        </div>

        {story.image_url && (
          <>
            <div className="article-image">
              <Image
                src={story.image_url}
                alt={text.title}
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 900px) 100vw, 900px"
              />
            </div>

            {(story.image_credit ||
              story.image_license) && (
              <p className="article-image-credit">
                {story.image_is_illustrative &&
                  (lang === "en"
                    ? "Illustrative image · "
                    : lang === "ur"
                      ? "نمائشی تصویر · "
                      : "نمائشي تصوير · ")}

                {story.image_credit ||
                  "Wikimedia Commons"}

                {story.image_license ? (
                  <>
                    {" · "}

                    {story.image_license_url ? (
                      <a
                        href={
                          story.image_license_url
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        {story.image_license}
                      </a>
                    ) : (
                      story.image_license
                    )}
                  </>
                ) : null}

                {story.image_source_url && (
                  <>
                    {" · "}

                    <a
                      href={
                        story.image_source_url
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      {lang === "en"
                        ? "image source"
                        : lang === "ur"
                          ? "تصویر کا ماخذ"
                          : "تصوير جو ذريعو"}{" "}
                      <ExternalLink
                        size={11}
                      />
                    </a>
                  </>
                )}
              </p>
            )}
          </>
        )}

        <article
          className="article-body"
          dir={isRtl ? "rtl" : "ltr"}
        >
          {paragraphs.map(
            (paragraph, index) => (
              <p key={index}>{paragraph}</p>
            )
          )}
        </article>

        {story.source_links &&
          story.source_links.length > 0 && (
            <section className="article-sources">
              <h2>
                {lang === "en"
                  ? "Sources used for verification"
                  : lang === "ur"
                    ? "تصدیق کے لیے استعمال کیے گئے ذرائع"
                    : "تصديق لاءِ استعمال ڪيل ذريعا"}
              </h2>

              <p>
                {lang === "en"
                  ? "PDTV independently rewrites verified facts; these links show the reporting used to cross-check the story."
                  : lang === "ur"
                    ? "پی ڈی ٹی وی تصدیق شدہ حقائق کو اپنی تحریر میں پیش کرتا ہے؛ یہ لنکس خبر کی جانچ کے لیے استعمال ہوئے۔"
                    : "پي ڊي ٽي وي تصديق ٿيل حقيقتن کي پنهنجي لفظن ۾ پيش ڪري ٿو؛ هي لنڪس خبر جي جاچ لاءِ استعمال ٿيا۔"}
              </p>

              <div>
                {story.source_links
                  .slice(0, 6)
                  .map((source, index) => (
                    <a
                      key={`${source.url}-${index}`}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>
                        {source.name}
                      </span>

                      <ExternalLink
                        size={13}
                      />
                    </a>
                  ))}
              </div>
            </section>
          )}
      </main>

      <footer>
        <div className="shell footer-inner">
          <div>
            <strong>
              {lang === "en"
                ? "PDTV"
                : lang === "ur"
                  ? "پی ڈی ٹی وی"
                  : "پي ڊي ٽي وي"}
            </strong>

            <p>
              {lang === "en"
                ? "Pakistan Diamond Television"
                : lang === "ur"
                  ? "پاکستان ڈائمنڈ ٹیلی وژن"
                  : "پاڪستان ڊائمنڊ ٽيليويزن"}
            </p>
          </div>

          <p>
            © {new Date().getFullYear()} PDTV.{" "}

            {lang === "en"
              ? "Pakistan Ki Awaaz, Duniya Tak."
              : lang === "ur"
                ? "پاکستان کی آواز، دنیا تک۔"
                : "پاڪستان جو آواز، دنيا تائين۔"}
          </p>
        </div>
      </footer>
    </div>
  );
}