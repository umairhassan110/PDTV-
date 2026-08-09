import Image from "next/image";
import Link from "next/link";
import type { Language } from "@/lib/types";

const brandText = {
  en: {
    short: "PDTV",
    full: "Pakistan Diamond Television",
  },
  ur: {
    short: "پی ڈی ٹی وی",
    full: "پاکستان ڈائمنڈ ٹیلی وژن",
  },
  sd: {
    short: "پي ڊي ٽي وي",
    full: "پاڪستان ڊائمنڊ ٽيليويزن",
  },
};

export function Logo({
  compact = false,
  language = "en",
}: {
  compact?: boolean;
  language?: Language;
}) {
  const text = brandText[language];
  const isRtl = language === "ur" || language === "sd";

  return (
    <Link
      href={`/?lang=${language}`}
      className={`brand ${isRtl ? "brand-rtl" : "brand-ltr"}`}
      aria-label="PDTV home"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Image
        src="/pdtv-logo.png"
        alt="PDTV HD News"
        width={compact ? 68 : 100}
        height={compact ? 40 : 56}
        priority
        className="pdtv-logo-image"
      />

      {!compact && (
        <span className="brand-copy">
          <strong>{text.short}</strong>
          <small>{text.full}</small>
        </span>
      )}
    </Link>
  );
}