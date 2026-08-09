import Link from "next/link";
import { forgotPasswordAction } from "@/app/admin/actions";
import { Logo } from "@/components/logo";
import { Notice } from "@/components/notice";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  return <main className="login-page"><section className="login-card"><Logo /><h1>Reset password</h1><p>Enter your approved Newsroom email and we will send a secure reset link.</p><Notice error={params.error} message={params.message} /><form action={forgotPasswordAction}><label>Email address<input type="email" name="email" required autoComplete="email" /></label><button>Send reset link</button></form><div className="login-switch"><Link href="/admin/login">Back to sign in</Link></div></section></main>;
}

