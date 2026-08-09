"use client";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  languageInfo,
  type Language,
} from "@/lib/types";

export function LanguageSwitcher({
  language,
}: {
  language: Language;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function changeLanguage(next: Language) {
    const query = new URLSearchParams(
      searchParams.toString()
    );

    query.set("lang", next);

    const nextUrl = `${pathname}?${query.toString()}`;

    router.push(nextUrl, {
      scroll: false,
    });
  }

  return (
    <div
      className="language-switcher"
      aria-label="Select language"
    >
      {(Object.keys(languageInfo) as Language[]).map(
        (code) => (
          <button
            key={code}
            type="button"
            className={
              language === code ? "active" : ""
            }
            onClick={() => changeLanguage(code)}
            aria-pressed={language === code}
          >
            {languageInfo[code].native}
          </button>
        )
      )}
    </div>
  );
}