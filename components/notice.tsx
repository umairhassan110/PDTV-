export function Notice({ message, error }: { message?: string; error?: string }) {
  if (!message && !error) return null;
  return <div className={`notice ${error ? "notice-error" : "notice-success"}`}>{error || message}</div>;
}

