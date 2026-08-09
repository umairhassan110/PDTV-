import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { storyBySlug } from "@/lib/data";
import { languageInfo, readLanguage, storyText } from "@/lib/types";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const lang = readLanguage((await searchParams).lang);
  const story = await storyBySlug(slug);
  if (!story) return { title: "Story not found" };
  const text = storyText(story, lang);
  return {
    title: text.title,
    description: text.summary,
    openGraph: { title: text.title, description: text.summary, images: story.image_url ? [story.image_url] : [] },
  };
}

export default async function NewsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { slug } = await params;
  const lang = readLanguage((await searchParams).lang);
  const story = await storyBySlug(slug);
  if (!story) notFound();
  const text = storyText(story, lang);

  return (
    <div dir={languageInfo[lang].dir}>
      <header className="article-header"><div className="shell article-nav"><Logo /><LanguageSwitcher language={lang} /></div></header>
      <main className="article-shell">
        <Link className="back-link" href={`/?lang=${lang}`}><ArrowLeft size={18} /> Back to PDTV</Link>
        <article>
          <span className="article-category">{story.category}</span>
          <h1>{text.title}</h1>
          <p className="article-summary">{text.summary}</p>
          <div className="article-meta"><span><UserRound size={17} /> {story.author}</span><span><CalendarDays size={17} /> {story.published_at ? new Date(story.published_at).toLocaleString() : ""}</span></div>
          {story.image_url && <div className="article-image"><Image src={story.image_url} alt="" fill priority sizes="(max-width: 900px) 100vw, 900px" /></div>}
          <div className="article-body">{text.body.split(/\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
        </article>
      </main>
      <footer><div className="shell footer-inner"><div><strong>PDTV</strong><p>Pakistan Diamond Television</p></div><p>Pakistan Ki Awaaz, Duniya Tak.</p></div></footer>
    </div>
  );
}

