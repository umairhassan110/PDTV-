"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { languageInfo, type Language } from "@/lib/types";

export function LanguageSwitcher({ language }: { language: Language }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function changeLanguage(next: Language) {
    const query = new URLSearchParams(params.toString());
    query.set("lang", next);
    router.push(`${pathname}?${query.toString()}`);
  }

  return (
    <div className="language-switcher" aria-label="Select language">
      {(Object.keys(languageInfo) as Language[]).map((code) => (
        <button
          key={code}
          type="button"
          className={language === code ? "active" : ""}
          onClick={() => changeLanguage(code)}
          aria-pressed={language === code}
        >
          {languageInfo[code].native}
        </button>
      ))}
    </div>
  );
}

