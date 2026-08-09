import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, Radio, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { StoryCard } from "@/components/story-card";
import { publishedStories } from "@/lib/data";
import { languageInfo, readLanguage, storyText } from "@/lib/types";

const ui = {
  en: { breaking: "Breaking News", latest: "Latest News", top: "Top Stories", live: "Live Bulletin", read: "Read full story", empty: "No published stories yet. Sign in to the Newsroom to publish your first report.", most: "Most Read" },
  ur: { breaking: "بریکنگ نیوز", latest: "تازہ ترین خبریں", top: "اہم خبریں", live: "لائیو بلیٹن", read: "مکمل خبر پڑھیں", empty: "ابھی کوئی خبر شائع نہیں ہوئی۔ پہلی خبر شائع کرنے کے لیے نیوز روم میں سائن اِن کریں۔", most: "سب سے زیادہ پڑھی گئی" },
  sd: { breaking: "تازيون خبرون", latest: "تازيون خبرون", top: "اهم خبرون", live: "لائيو بليٽن", read: "مڪمل خبر پڙهو", empty: "اڃا ڪا خبر شايع نه ٿي آهي. پهرين خبر شايع ڪرڻ لاءِ نيوز روم ۾ سائن اِن ڪريو.", most: "سڀ کان وڌيڪ پڙهيل" },
};

export default async function Home({ searchParams }: { searchParams: Promise<{ lang?: string; category?: string }> }) {
  const params = await searchParams;
  const language = readLanguage(params.lang);
  const stories = await publishedStories();
  const filtered = params.category ? stories.filter((story) => story.category === params.category) : stories;
  const lead = filtered.find((story) => story.is_lead) || filtered[0];
  const rest = filtered.filter((story) => story.id !== lead?.id);
  const breaking = stories.filter((story) => story.is_breaking);
  const t = ui[language];

  return (
    <div dir={languageInfo[language].dir}>
      <SiteHeader language={language} />
      {breaking.length > 0 && (
        <div className="breaking-strip">
          <div className="shell breaking-inner">
            <strong>{t.breaking}</strong>
            <div className="ticker"><span>{breaking.map((s) => storyText(s, language).title).join("  •  ")}</span></div>
          </div>
        </div>
      )}
      <main>
        <section className="shell hero-grid">
          {lead ? (
            <article className="lead-story">
              <div className="lead-image">
                {lead.image_url ? <Image src={lead.image_url} alt="" fill priority sizes="(max-width: 900px) 100vw, 66vw" /> : <div className="image-placeholder hero-placeholder"><span>PDTV</span></div>}
                <div className="lead-overlay" />
                <div className="lead-content">
                  <span className="category-chip">{lead.category}</span>
                  <h1>{storyText(lead, language).title}</h1>
                  <p>{storyText(lead, language).summary}</p>
                  <Link href={`/news/${lead.slug}?lang=${language}`}>{t.read} <ArrowRight size={18} /></Link>
                </div>
              </div>
            </article>
          ) : (
            <div className="empty-state"><Sparkles size={32} /><h1>PDTV</h1><p>{t.empty}</p><Link href="/admin">Open Newsroom</Link></div>
          )}
          <aside className="live-panel">
            <div className="live-heading"><span><Radio size={17} /> {t.live}</span><b>LIVE</b></div>
            <div className="live-screen"><Play size={44} fill="currentColor" /><span>PDTV LIVE</span></div>
            <div className="mini-list">
              {stories.slice(0, 3).map((story, index) => (
                <Link key={story.id} href={`/news/${story.slug}?lang=${language}`}>
                  <b>{String(index + 1).padStart(2, "0")}</b><span>{storyText(story, language).title}</span>
                </Link>
              ))}
            </div>
          </aside>
        </section>

        {filtered.length > 0 && (
          <section className="shell content-section">
            <div className="section-title"><div><span>{t.latest}</span><h2>{params.category || t.top}</h2></div><i /></div>
            <div className="content-layout">
              <div className="stories-grid">{rest.map((story) => <StoryCard key={story.id} story={story} language={language} />)}</div>
              <aside className="most-read">
                <h3>{t.most}</h3>
                {stories.slice(0, 5).map((story, index) => (
                  <Link key={story.id} href={`/news/${story.slug}?lang=${language}`}>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <span><small>{story.category}</small>{storyText(story, language).title}</span>
                  </Link>
                ))}
              </aside>
            </div>
          </section>
        )}
      </main>
      <footer><div className="shell footer-inner"><div><strong>PDTV</strong><p>Pakistan Diamond Television</p></div><p>© {new Date().getFullYear()} PDTV. Pakistan Ki Awaaz, Duniya Tak.</p></div></footer>
    </div>
  );
}

