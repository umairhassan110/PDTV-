import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="PDTV home">
      <span className="brand-mark"><span>P</span></span>
      <span className="brand-copy">
        <strong>PDTV</strong>
        {!compact && <small>Pakistan Diamond Television</small>}
      </span>
    </Link>
  );
}

