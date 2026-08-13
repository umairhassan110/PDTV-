import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  Facebook,
  Mail,
  Play,
  Radio,
  Youtube,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { StoryCard } from "@/components/story-card";
import { publishedStories } from "@/lib/data";

import {
  categoryText,
  formatPublishedDate,
  readLanguage,
  storyText,
  type Language,
} from "@/lib/types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.pdtv.me";

const ui = {
  en: {
    breaking: "Breaking News",
    latest: "Latest News",
    top: "Top Stories",
    live: "Live Bulletin",
    read: "Read full story",
    empty:
      "No published stories yet. Sign in to the Newsroom to publish your first report.",
    openNewsroom: "Open Newsroom",
    most: "Most Read",
    liveNow: "LIVE",
    pdtvLive: "PDTV LIVE",
    brand: "PDTV",
    fullName: "Pakistan Diamond Television",
    copyright: "Pakistan Ki Awaaz, Duniya Tak.",
    seoTitle: "PDTV | Latest Pakistan & Sindh News",
    seoDescription:
      "Latest breaking news from Pakistan, Sindh and around the world in English.",
  },

  ur: {
    breaking: "بریکنگ نیوز",
    latest: "تازہ ترین خبریں",
    top: "اہم خبریں",
    live: "لائیو بلیٹن",
    read: "مکمل خبر پڑھیں",
    empty:
      "ابھی کوئی خبر شائع نہیں ہوئی۔ پہلی خبر شائع کرنے کے لیے نیوز روم میں سائن اِن کریں۔",
    openNewsroom: "نیوز روم کھولیں",
    most: "سب سے زیادہ پڑھی گئی",
    liveNow: "لائیو",
    pdtvLive: "پی ڈی ٹی وی لائیو",
    brand: "پی ڈی ٹی وی",
    fullName: "پاکستان ڈائمنڈ ٹیلی وژن",
    copyright: "پاکستان کی آواز، دنیا تک۔",
    seoTitle:
      "پی ڈی ٹی وی | پاکستان اور سندھ کی تازہ خبریں",
    seoDescription:
      "پاکستان، سندھ اور دنیا بھر کی تازہ ترین اور بریکنگ خبریں اردو میں۔",
  },

  sd: {
    breaking: "تازيون خبرون",
    latest: "تازيون خبرون",
    top: "اهم خبرون",
    live: "لائيو بليٽن",
    read: "مڪمل خبر پڙهو",
    empty:
      "اڃا ڪا خبر شايع نه ٿي آهي. پهرين خبر شايع ڪرڻ لاءِ نيوز روم ۾ سائن اِن ڪريو.",
    openNewsroom: "نيوز روم کوليو",
    most: "سڀ کان وڌيڪ پڙهيل",
    liveNow: "لائيو",
    pdtvLive: "پي ڊي ٽي وي لائيو",
    brand: "پي ڊي ٽي وي",
    fullName: "پاڪستان ڊائمنڊ ٽيليويزن",
    copyright: "پاڪستان جو آواز، دنيا تائين۔",
    seoTitle:
      "پي ڊي ٽي وي | پاڪستان ۽ سنڌ جون تازيون خبرون",
    seoDescription:
      "پاڪستان، سنڌ ۽ دنيا جون تازيون ۽ اهم خبرون سنڌي ٻولي ۾.",
  },
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{
    lang?: string;
    category?: string;
  }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const language = readLanguage(params.lang);
  const t = ui[language];

  const canonical = params.category
    ? `${SITE_URL}/?lang=${language}&category=${encodeURIComponent(
        params.category
      )}`
    : `${SITE_URL}/?lang=${language}`;

  return {
    title: t.seoTitle,
    description: t.seoDescription,

    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/?lang=en`,
        ur: `${SITE_URL}/?lang=ur`,
        sd: `${SITE_URL}/?lang=sd`,
      },
    },

    openGraph: {
      type: "website",
      url: canonical,
      title: t.seoTitle,
      description: t.seoDescription,
      siteName: "PDTV",
      images: [
        {
          url: `${SITE_URL}/pdtv-logo.png`,
          alt: "PDTV Pakistan Diamond Television",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: t.seoTitle,
      description: t.seoDescription,
      images: [`${SITE_URL}/pdtv-logo.png`],
    },
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    lang?: string;
    category?: string;
  }>;
}) {
  const params = await searchParams;

  const language: Language =
    readLanguage(params.lang);

  const isRtl =
    language === "ur" ||
    language === "sd";

  const stories =
    await publishedStories();

  const normalizedCategory =
    params.category?.trim().toLowerCase() ?? null;

  const filtered = params.category
    ? stories.filter(
        (story) =>
          story.category.trim().toLowerCase() ===
          normalizedCategory
      )
    : stories;

  const lead =
    filtered.find(
      (story) => story.is_lead
    ) || filtered[0];

  const rest =
    filtered.filter(
      (story) =>
        story.id !== lead?.id
    );

  const breaking =
    stories.filter(
      (story) =>
        story.is_breaking
    );

  const t = ui[language];

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      <SiteHeader
        language={language}
      />

      {breaking.length > 0 && (
        <section className="breaking-strip">
          <div className="shell breaking-inner">
            <strong>
              {t.breaking}
            </strong>

            <div className="ticker">
              <span>
                {breaking
                  .map(
                    (story) =>
                      storyText(
                        story,
                        language
                      ).title
                  )
                  .join("  •  ")}
              </span>
            </div>
          </div>
        </section>
      )}

      <main>
        <section className="shell hero-grid">
          <div className="lead-story">
            {lead ? (
              <div className="lead-image">
                {lead.image_url ? (
                  <Image
                    src={lead.image_url}
                    alt={
                      storyText(
                        lead,
                        language
                      ).title
                    }
                    fill
                    priority
                    fetchPriority="high"
                    sizes="(max-width: 950px) 100vw, 66vw"
                  />
                ) : (
                  <div className="image-placeholder">
                    PDTV
                  </div>
                )}

                <div className="lead-overlay" />

                <div className="lead-content">
                  <span className="category-chip">
                    {categoryText(
                      lead.category,
                      language
                    )}
                  </span>

                  <h1>
                    {
                      storyText(
                        lead,
                        language
                      ).title
                    }
                  </h1>

                  <p>
                    {
                      storyText(
                        lead,
                        language
                      ).summary
                    }
                  </p>

                  {lead.published_at && (
                    <div className="story-date">
                      {formatPublishedDate(
                        lead.published_at,
                        language
                      )}
                    </div>
                  )}

                  <Link
                    href={`/news/${lead.slug}?lang=${language}`}
                  >
                    {t.read}

                    <ArrowRight
                      size={16}
                      style={{
                        transform:
                          isRtl
                            ? "rotate(180deg)"
                            : "none",
                      }}
                    />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <span className="category-chip">
                  PDTV
                </span>

                <h1>{t.brand}</h1>

                <p>{t.empty}</p>

                <Link href="/admin">
                  {t.openNewsroom}
                </Link>
              </div>
            )}
          </div>

          <aside className="live-panel">
            <div className="live-heading">
              <span>
                <Radio size={16} />
                {t.live}
              </span>

              <b>{t.liveNow}</b>
            </div>

            <Link
              className="live-screen"
              href={`/live?lang=${language}`}
              aria-label={t.pdtvLive}
            >
              <Play
                size={46}
                fill="currentColor"
              />

              <span>
                {t.pdtvLive}
              </span>
            </Link>

            <div className="mini-list">
              {stories
                .slice(0, 3)
                .map(
                  (
                    story,
                    index
                  ) => (
                    <Link
                      key={story.id}
                      href={`/news/${story.slug}?lang=${language}`}
                    >
                      <b>
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </b>

                      <span>
                        {
                          storyText(
                            story,
                            language
                          ).title
                        }
                      </span>
                    </Link>
                  )
                )}
            </div>
          </aside>
        </section>

        {filtered.length > 0 && (
          <section className="shell content-section">
            <div className="section-title">
              <div>
                <span>
                  {t.latest}
                </span>

                <h2>
                  {params.category
                    ? categoryText(
                        params.category,
                        language
                      )
                    : t.top}
                </h2>
              </div>

              <i />
            </div>

            <div className="content-layout">
              <div className="stories-grid">
                {rest.map(
                  (story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      language={language}
                    />
                  )
                )}
              </div>

              <aside className="most-read">
                <h3>{t.most}</h3>

                {stories
                  .slice(0, 5)
                  .map(
                    (
                      story,
                      index
                    ) => (
                      <Link
                        key={story.id}
                        href={`/news/${story.slug}?lang=${language}`}
                      >
                        <b>
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </b>

                        <span>
                          <small>
                            {categoryText(
                              story.category,
                              language
                            )}
                          </small>

                          {
                            storyText(
                              story,
                              language
                            ).title
                          }
                        </span>
                      </Link>
                    )
                  )}
              </aside>
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer" dir={isRtl ? "rtl" : "ltr"}>
        <div className="shell site-footer-main">
          <div className="footer-brand">
            <div className="footer-brand-mark">PDTV</div>

            <h2>Pakistan Diamond Television</h2>

            <p>Pakistan Ki Awaaz, Duniya Tak.</p>

            <div className="footer-socials" aria-label="Social and contact links">
              <a
                href="https://www.facebook.com/share/1DVMATXyiB/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PDTV on Facebook"
              >
                <Facebook size={15} aria-hidden="true" />
                Facebook
              </a>

              <a
                href="https://youtube.com/@pdtvnewschanel?si=taDL8cgr1Cjm6DtL"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PDTV on YouTube"
              >
                <Youtube size={15} aria-hidden="true" />
                YouTube
              </a>

              <a
                href="mailto:Uh3447347@gmail.com"
                aria-label="Email PDTV"
              >
                <Mail size={15} aria-hidden="true" />
                Email
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h3>Corporate</h3>

            <Link href="/about">About Us</Link>
            <Link href="/contact">Contact Us</Link>
            <Link href="/careers">Careers</Link>
            <Link href="/advertise">Advertise</Link>
          </div>

          <div className="footer-column">
            <h3>Important Links</h3>

            <Link href="/editorial-policy">Editorial Policy</Link>
            <Link href="/corrections-policy">Corrections Policy</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms &amp; Conditions</Link>
          </div>

          <div className="footer-column">
            <h3>Categories</h3>

            <Link href={`/?lang=${language}&category=Pakistan`}>Pakistan</Link>
            <Link href={`/?lang=${language}&category=Sindh`}>Sindh</Link>
            <Link href={`/?lang=${language}&category=World`}>World</Link>
            <Link href={`/?lang=${language}&category=Politics`}>Politics</Link>
            <Link href={`/?lang=${language}&category=Sports`}>Sports</Link>
            <Link href={`/?lang=${language}&category=Business`}>Business</Link>
            <Link href={`/?lang=${language}&category=Technology`}>Technology</Link>
            <Link href={`/?lang=${language}&category=Education`}>Education</Link>
            <Link href={`/?lang=${language}&category=Entertainment`}>Entertainment</Link>
            <Link href={`/?lang=${language}&category=Health`}>Health</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="shell footer-bottom-inner">
            <span>© 2026 PDTV. Pakistan Ki Awaaz, Duniya Tak.</span>
            <strong>Pakistan Diamond Television</strong>
          </div>
        </div>
      </footer>

    </div>
  );
}