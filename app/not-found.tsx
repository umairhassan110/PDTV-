import Link from "next/link";

export default function NotFound() {
  return <main className="center-page"><h1>404</h1><p>This PDTV story could not be found.</p><Link href="/">Return home</Link></main>;
}

