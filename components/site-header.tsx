import Link from "next/link";
import { Clock3, Radio } from "lucide-react";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Language } from "@/lib/types";

const labels = {
  en: {
    home: "Home",
    pakistan: "Pakistan",
    world: "World",
    business: "Business",
    sports: "Sports",
    tech: "Technology",
    admin: "Newsroom",
    live: "LIVE",
    tagline: "Pakistan Ki Awaaz, Duniya Tak",
  },
  ur: {
    home: "صفحۂ اول",
    pakistan: "پاکستان",
    world: "دنیا",
    business: "کاروبار",
    sports: "کھیل",
    tech: "ٹیکنالوجی",
    admin: "نیوز روم",
    live: "لائیو",
    tagline: "پاکستان کی آواز، دنیا تک",
  },
  sd: {
    home: "مک صفحو",
    pakistan: "پاڪستان",
    world: "دنيا",
    business: "ڪاروبار",
    sports: "رانديون",
    tech: "ٽيڪنالاجي",
    admin: "نيوز روم",
    live: "لائيو",
    tagline: "پاڪستان جو آواز، دنيا تائين",
  },
};

export function SiteHeader({ language }: { language: Language }) {
  const t = labels[language];

  const locale =
    language === "en"
      ? "en-PK"
      : language === "ur"
      ? "ur-PK"
      : "sd-PK";

  const date = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const isRtl = language === "ur" || language === "sd";

  return (
    <>
      <div className="utility-bar" dir={isRtl ? "rtl" : "ltr"}>
        <div className="shell utility-inner">
          <span>
            <Clock3 size={14} />
            {date}
          </span>

          <Link href="/live" className="live-label">
            <Radio size={14} />
            {t.live}
          </Link>
        </div>
      </div>

      <header
        className="site-header"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="shell header-main">
          <Logo language={language} />

          <p className="tagline">{t.tagline}</p>

          <LanguageSwitcher language={language} />
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <div className="shell nav-inner">
            <Link href={`/?lang=${language}`}>
              {t.home}
            </Link>

            <Link href={`/?lang=${language}&category=Pakistan`}>
              {t.pakistan}
            </Link>

            <Link href={`/?lang=${language}&category=World`}>
              {t.world}
            </Link>

            <Link href={`/?lang=${language}&category=Business`}>
              {t.business}
            </Link>

            <Link href={`/?lang=${language}&category=Sports`}>
              {t.sports}
            </Link>

            <Link href={`/?lang=${language}&category=Technology`}>
              {t.tech}
            </Link>

            <Link href="/admin" className="newsroom-link">
              {t.admin}
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
}