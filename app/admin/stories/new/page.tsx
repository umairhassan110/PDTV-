import { AdminShell } from "@/components/admin-shell";
import { StoryForm } from "@/components/story-form";
import { requireStaff } from "@/lib/auth";

export default async function NewStoryPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const profile = await requireStaff();
  const { error } = await searchParams;
  return <AdminShell profile={profile}><div className="admin-heading"><div><span>NEW CONTENT</span><h1>Create story</h1><p>Complete all three language versions, then save or publish.</p></div></div><StoryForm error={error} /></AdminShell>;
}

