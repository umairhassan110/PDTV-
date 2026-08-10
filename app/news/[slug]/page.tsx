import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  UserRound,
} from "lucide-react";
import { notFound } from "next/navigation";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { storyBySlug } from "@/lib/data";
import {
  categoryText,
  readLanguage,
  storyText,
  type Language,
} from "@/lib/types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.pdtv.me";

function getLocale(language: Language) {
  if (language === "ur") return "ur-PK";
  if (language === "sd") return "sd-PK";
  return "en-PK";
}

function formatDate(
  value: string,
  language: Language
) {
  return new Intl.DateTimeFormat(
    getLocale(language),
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(new Date(value));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lang = readLanguage(
    (await searchParams).lang
  );

  const story = await storyBySlug(slug);

  if (!story) {
    return {
      title: "Story not found | PDTV",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const text = storyText(story, lang);

  const canonicalUrl =
    `${SITE_URL}/news/${story.slug}?lang=${lang}`;

  const image =
    story.image_url ||
    `${SITE_URL}/pdtv-logo.png`;

  return {
    title: text.title,
    description: text.summary,

    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${SITE_URL}/news/${story.slug}?lang=en`,
        ur: `${SITE_URL}/news/${story.slug}?lang=ur`,
        sd: `${SITE_URL}/news/${story.slug}?lang=sd`,
      },
    },

    openGraph: {
      type: "article",
      url: canonicalUrl,
      siteName: "PDTV",
      title: text.title,
      description: text.summary,
      images: [
        {
          url: image,
          alt: text.title,
        },
      ],
      publishedTime:
        story.published_at || undefined,
      modifiedTime:
        story.updated_at || undefined,
      authors: [story.author],
      section: story.category,
    },

    twitter: {
      card: "summary_large_image",
      title: text.title,
      description: text.summary,
      images: [image],
    },

    robots: {
      index:
        story.status === "published",
      follow:
        story.status === "published",
    },
  };
}

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;

  const lang = readLanguage(
    (await searchParams).lang
  );

  const story = await storyBySlug(slug);

  if (!story) {
    notFound();
  }

  const text = storyText(
    story,
    lang
  );

  const isRtl =
    lang === "ur" ||
    lang === "sd";

  const canonicalUrl =
    `${SITE_URL}/news/${story.slug}?lang=${lang}`;

  const articleImage =
    story.image_url ||
    `${SITE_URL}/pdtv-logo.png`;

  const publishedDate =
    story.published_at
      ? formatDate(
          story.published_at,
          lang
        )
      : null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",

    headline: text.title,

    description: text.summary,

    image: [articleImage],

    datePublished:
      story.published_at ||
      story.created_at,

    dateModified:
      story.updated_at ||
      story.published_at ||
      story.created_at,

    author: {
      "@type": "Person",
      name: story.author,
    },

    publisher: {
      "@type": "Organization",
      name:
        "PDTV Pakistan Diamond Television",

      logo: {
        "@type": "ImageObject",
        url:
          `${SITE_URL}/pdtv-logo.png`,
      },
    },

    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },

    articleSection:
      categoryText(
        story.category,
        lang
      ),

    inLanguage:
      lang === "en"
        ? "en-PK"
        : lang === "ur"
          ? "ur-PK"
          : "sd-PK",
  };

  return (
    <div
      dir={
        isRtl
          ? "rtl"
          : "ltr"
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              structuredData
            ),
        }}
      />

      <header className="article-header">
        <div className="shell article-nav">
          <Logo
            language={lang}
          />

          <LanguageSwitcher
            language={lang}
          />
        </div>
      </header>

      <main className="article-shell">
        <Link
          className="back-link"
          href={`/?lang=${lang}`}
        >
          <ArrowLeft
            size={16}
            style={{
              transform:
                isRtl
                  ? "rotate(180deg)"
                  : "none",
            }}
          />

          {lang === "en"
            ? "Back to PDTV"
            : lang === "ur"
              ? "پی ڈی ٹی وی پر واپس جائیں"
              : "پي ڊي ٽي وي ڏانهن واپس وڃو"}
        </Link>

        <div className="article-category">
          {categoryText(
            story.category,
            lang
          )}
        </div>

        <h1>
          {text.title}
        </h1>

        <p className="article-summary">
          {text.summary}
        </p>

        <div className="article-meta">
          <span>
            <UserRound size={15} />
            {story.author}
          </span>

          {publishedDate && (
            <span>
              <CalendarDays
                size={15}
              />
              {publishedDate}
            </span>
          )}
        </div>

        {story.image_url && (
          <div className="article-image">
            <Image
              src={
                story.image_url
              }
              alt={
                text.title
              }
              fill
              priority
              sizes="(max-width: 900px) 100vw, 900px"
            />
          </div>
        )}

        <article className="article-body">
          {text.body
            .split(/\n+/)
            .filter(
              (paragraph) =>
                paragraph.trim()
                  .length > 0
            )
            .map(
              (
                paragraph,
                index
              ) => (
                <p key={index}>
                  {paragraph}
                </p>
              )
            )}
        </article>
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