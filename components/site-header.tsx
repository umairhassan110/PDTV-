import Link from "next/link";
import { Clock3, Radio } from "lucide-react";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Language } from "@/lib/types";

const labels = {
  en: { home: "Home", pakistan: "Pakistan", world: "World", business: "Business", sports: "Sports", tech: "Technology", admin: "Newsroom" },
  ur: { home: "صفحۂ اول", pakistan: "پاکستان", world: "دنیا", business: "کاروبار", sports: "کھیل", tech: "ٹیکنالوجی", admin: "نیوز روم" },
  sd: { home: "مک صفحو", pakistan: "پاڪستان", world: "دنيا", business: "ڪاروبار", sports: "رانديون", tech: "ٽيڪنالاجي", admin: "نيوز روم" },
};

export function SiteHeader({ language }: { language: Language }) {
  const t = labels[language];
  const date = new Intl.DateTimeFormat(language === "en" ? "en-PK" : language === "ur" ? "ur-PK" : "sd-PK", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }).format(new Date());

  return (
    <>
      <div className="utility-bar">
        <div className="shell utility-inner">
          <span><Clock3 size={14} /> {date}</span>
          <span className="live-label"><Radio size={14} /> LIVE</span>
        </div>
      </div>
      <header className="site-header">
        <div className="shell header-main">
          <Logo />
          <p className="tagline">Pakistan Ki Awaaz, Duniya Tak</p>
          <LanguageSwitcher language={language} />
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          <div className="shell nav-inner">
            <Link href={`/?lang=${language}`}>{t.home}</Link>
            <Link href={`/?lang=${language}&category=Pakistan`}>{t.pakistan}</Link>
            <Link href={`/?lang=${language}&category=World`}>{t.world}</Link>
            <Link href={`/?lang=${language}&category=Business`}>{t.business}</Link>
            <Link href={`/?lang=${language}&category=Sports`}>{t.sports}</Link>
            <Link href={`/?lang=${language}&category=Technology`}>{t.tech}</Link>
            <Link className="newsroom-link" href="/admin">{t.admin}</Link>
          </div>
        </nav>
      </header>
    </>
  );
}
