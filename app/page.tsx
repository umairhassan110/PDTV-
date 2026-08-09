import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, Radio } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { StoryCard } from "@/components/story-card";
import { publishedStories } from "@/lib/data";
import { storyText } from "@/lib/types";
import type { Language } from "@/lib/types";

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
  },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    lang?: string;
    category?: string;
  }>;
}) {
  const params = await searchParams;

  /*
   * Default language = Sindhi
   *
   * /             -> Sindhi
   * /?lang=sd     -> Sindhi
   * /?lang=ur     -> Urdu
   * /?lang=en     -> English
   */
  const language: Language =
    params.lang === "en"
      ? "en"
      : params.lang === "ur"
      ? "ur"
      : "sd";

  const isRtl = language === "ur" || language === "sd";

  const stories = await publishedStories();

  const filtered = params.category
    ? stories.filter((story) => story.category === params.category)
    : stories;

  const lead =
    filtered.find((story) => story.is_lead) || filtered[0];

  const rest = filtered.filter(
    (story) => story.id !== lead?.id
  );

  const breaking = stories.filter(
    (story) => story.is_breaking
  );

  const t = ui[language];

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      <SiteHeader language={language} />

      {breaking.length > 0 && (
        <section className="breaking-strip">
          <div className="shell breaking-inner">
            <strong>{t.breaking}</strong>

            <div className="ticker">
              <span>
                {breaking
                  .map((story) => storyText(story, language).title)
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
                    alt={storyText(lead, language).title}
                    fill
                    priority
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
                    {lead.category}
                  </span>

                  <h1>
                    {storyText(lead, language).title}
                  </h1>

                  <p>
                    {storyText(lead, language).summary}
                  </p>

                  <Link
                    href={`/news/${lead.slug}?lang=${language}`}
                  >
                    {t.read}
                    <ArrowRight
                      size={16}
                      style={{
                        transform: isRtl
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

            <div className="live-screen">
              <Play size={46} fill="currentColor" />
              <span>{t.pdtvLive}</span>
            </div>

            <div className="mini-list">
              {stories.slice(0, 3).map((story, index) => (
                <Link
                  key={story.id}
                  href={`/news/${story.slug}?lang=${language}`}
                >
                  <b>
                    {String(index + 1).padStart(2, "0")}
                  </b>

                  <span>
                    {storyText(story, language).title}
                  </span>
                </Link>
              ))}
            </div>
          </aside>
        </section>

        {filtered.length > 0 && (
          <section className="shell content-section">
            <div className="section-title">
              <div>
                <span>{t.latest}</span>

                <h2>
                  {params.category || t.top}
                </h2>
              </div>

              <i />
            </div>

            <div className="content-layout">
              <div className="stories-grid">
                {rest.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    language={language}
                  />
                ))}
              </div>

              <aside className="most-read">
                <h3>{t.most}</h3>

                {stories.slice(0, 5).map((story, index) => (
                  <Link
                    key={story.id}
                    href={`/news/${story.slug}?lang=${language}`}
                  >
                    <b>
                      {String(index + 1).padStart(2, "0")}
                    </b>

                    <span>
                      <small>{story.category}</small>
                      {storyText(story, language).title}
                    </span>
                  </Link>
                ))}
              </aside>
            </div>
          </section>
        )}
      </main>

      <footer>
        <div className="shell footer-inner">
          <div>
            <strong>{t.brand}</strong>
            <p>{t.fullName}</p>
          </div>

          <p>
            © {new Date().getFullYear()} {t.brand}.{" "}
            {t.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
}