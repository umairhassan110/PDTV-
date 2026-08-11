import Link from "next/link";
import { Bot, FilePlus2, Files, LogOut, Newspaper, UsersRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { logoutAction } from "@/app/admin/actions";
import type { Profile } from "@/lib/types";

export function AdminShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Logo />
        <div className="admin-profile"><span>{profile.full_name.slice(0, 1).toUpperCase()}</span><div><strong>{profile.full_name}</strong><small>{profile.role}</small></div></div>
        <nav>
          <Link href="/admin"><Newspaper size={18} /> Overview</Link>
          <Link href="/admin"><Files size={18} /> All Stories</Link>
          <Link href="/admin/stories/new"><FilePlus2 size={18} /> New Story</Link>
          <Link href="/admin/ai-newsroom"><Bot size={18} /> AI Newsroom</Link>
          {profile.role === "owner" && <Link href="/admin/editors"><UsersRound size={18} /> Editors</Link>}
        </nav>
        <form action={logoutAction}><button><LogOut size={18} /> Sign out</button></form>
      </aside>
      <div className="admin-content">
        <div className="admin-topbar"><span><Newspaper size={18} /> PDTV Newsroom</span><Link href="/" target="_blank">View website</Link></div>
        <main>{children}</main>
      </div>
    </div>
  );
}

