import { resetPasswordAction } from "@/app/admin/actions";
import { Logo } from "@/components/logo";
import { Notice } from "@/components/notice";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="login-page"><section className="login-card"><Logo /><h1>Choose new password</h1><p>Use at least 8 characters and keep it private.</p><Notice error={error} /><form action={resetPasswordAction}><label>New password<input type="password" name="password" required minLength={8} autoComplete="new-password" /></label><button>Update password</button></form></section></main>;
}
