import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
} from "lucide-react";

import {
  categoryText,
  formatPublishedDate,
  storyText,
  type Language,
  type Story,
} from "@/lib/types";

export function StoryCard({
  story,
  language,
}: {
  story: Story;
  language: Language;
}) {
  const text = storyText(
    story,
    language
  );

  const isRtl =
    language === "ur" ||
    language === "sd";

  const publishedDate =
    story.published_at
      ? formatPublishedDate(
          story.published_at,
          language
        )
      : null;

  return (
    <article
      className="story-card"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Link
        className="story-image"
        href={`/news/${story.slug}?lang=${language}`}
      >
        {story.image_url ? (
          <Image
            src={story.image_url}
            alt={text.title}
            fill
            sizes="(max-width: 700px) 100vw, 50vw"
          />
        ) : (
          <div className="image-placeholder">
            PDTV
          </div>
        )}

        <span className="category-chip">
          {categoryText(
            story.category,
            language
          )}
        </span>
      </Link>

      <div className="story-content">
        <h3>
          <Link
            href={`/news/${story.slug}?lang=${language}`}
          >
            {text.title}
          </Link>
        </h3>

        <p>{text.summary}</p>

        <div className="story-meta">
          <span className="story-date-meta">
            {publishedDate && (
              <>
                <CalendarDays size={14} />
                {publishedDate}
              </>
            )}
          </span>

          <Link
            aria-label={`Read ${text.title}`}
            href={`/news/${story.slug}?lang=${language}`}
          >
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}