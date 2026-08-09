import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import { activateAction, loginAction } from "@/app/admin/actions";
import { Logo } from "@/components/logo";
import { Notice } from "@/components/notice";
import { currentUser } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ mode?: string; error?: string; message?: string }> }) {
  if (await currentUser()) redirect("/admin");
  const params = await searchParams;
  const activate = params.mode === "activate";
  return (
    <main className="login-page">
      <section className="login-card">
        <Logo />
        <div className="login-icon"><LockKeyhole size={25} /></div>
        <h1>{activate ? "Activate approved account" : "Newsroom sign in"}</h1>
        <p>{activate ? "Your email must first be approved by the PDTV owner." : "Only the owner and approved editors can continue."}</p>
        <Notice error={params.error} message={params.message} />
        <form action={activate ? activateAction : loginAction}>
          {activate && <label>Full name<input name="full_name" required autoComplete="name" /></label>}
          <label>Email address<input name="email" type="email" required autoComplete="email" /></label>
          <label>Password<input name="password" type="password" required minLength={8} autoComplete={activate ? "new-password" : "current-password"} /></label>
          <button type="submit">{activate ? "Create secure account" : "Sign in"}</button>
        </form>
        <div className="login-switch">
          {activate ? <Link href="/admin/login">Already activated? Sign in</Link> : <Link href="/admin/login?mode=activate">Approved editor? Activate account</Link>}
          {activate ? <Link href="/">Return to website</Link> : <Link href="/admin/forgot-password">Forgot password?</Link>}
        </div>
      </section>
    </main>
  );
}

