import type { Metadata } from "next";
import Link from "next/link";
import {
  Radio,
  Tv,
} from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import {
  readLanguage,
  type Language,
} from "@/lib/types";

const text = {
  en: {
    title: "PDTV Live",
    heading: "PDTV Live",
    message:
      "PDTV live streaming will be available here.",
    home: "Return to PDTV",
    status: "Live service",
  },

  ur: {
    title: "پی ڈی ٹی وی لائیو",
    heading: "پی ڈی ٹی وی لائیو",
    message:
      "پی ڈی ٹی وی کی لائیو اسٹریمنگ یہاں دستیاب ہوگی۔",
    home: "پی ڈی ٹی وی پر واپس جائیں",
    status: "لائیو سروس",
  },

  sd: {
    title: "پي ڊي ٽي وي لائيو",
    heading: "پي ڊي ٽي وي لائيو",
    message:
      "پي ڊي ٽي وي جي لائيو اسٽريمنگ هتي دستياب ٿيندي.",
    home: "پي ڊي ٽي وي ڏانهن واپس وڃو",
    status: "لائيو سروس",
  },
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{
    lang?: string;
  }>;
}): Promise<Metadata> {
  const language =
    readLanguage(
      (await searchParams).lang
    );

  return {
    title: text[language].title,
    description:
      text[language].message,

    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{
    lang?: string;
  }>;
}) {
  const language: Language =
    readLanguage(
      (await searchParams).lang
    );

  const isRtl =
    language === "ur" ||
    language === "sd";

  const t = text[language];

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
    >
      <header className="article-header">
        <div className="shell article-nav">
          <Logo
            language={language}
          />

          <LanguageSwitcher
            language={language}
          />
        </div>
      </header>

      <main className="live-page">
        <section className="live-page-card">
          <div className="live-page-icon">
            <Tv size={42} />
          </div>

          <span className="live-page-status">
            <Radio size={14} />
            {t.status}
          </span>

          <h1>
            {t.heading}
          </h1>

          <p>
            {t.message}
          </p>

          <Link
            className="primary-button"
            href={`/?lang=${language}`}
          >
            {t.home}
          </Link>
        </section>
      </main>
    </div>
  );
}