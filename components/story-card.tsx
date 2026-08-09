import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { storyText, type Language, type Story } from "@/lib/types";

export function StoryCard({ story, language }: { story: Story; language: Language }) {
  const text = storyText(story, language);
  return (
    <article className="story-card">
      <Link className="story-image" href={`/news/${story.slug}?lang=${language}`}>
        {story.image_url ? (
          <Image src={story.image_url} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" />
        ) : <div className="image-placeholder"><span>PDTV</span></div>}
        <span className="category-chip">{story.category}</span>
      </Link>
      <div className="story-content">
        <h3><Link href={`/news/${story.slug}?lang=${language}`}>{text.title}</Link></h3>
        <p>{text.summary}</p>
        <div className="story-meta">
          <time>{story.published_at ? new Date(story.published_at).toLocaleDateString() : ""}</time>
          <Link aria-label="Read story" href={`/news/${story.slug}?lang=${language}`}><ArrowUpRight size={18} /></Link>
        </div>
      </div>
    </article>
  );
}

