import Link from "next/link";

export default function NotFound() {
  return (
    <main className="center-page">
      <h1>404</h1>
      <p>Page Not Found</p>
      <p>The page you're looking for doesn't exist or may have been moved.</p>
      <Link href="/">Return Home</Link>
    </main>
  );
}
