import Image from "next/image";
import { Save, Send } from "lucide-react";
import { saveStoryAction } from "@/app/admin/actions";
import { Notice } from "@/components/notice";
import type { Story } from "@/lib/types";

const categories = ["Pakistan", "World", "Business", "Sports", "Technology", "Health", "Entertainment", "Sindh"];

export function StoryForm({ story, error }: { story?: Story | null; error?: string }) {
  return (
    <form className="story-form" action={saveStoryAction}>
      <input type="hidden" name="id" value={story?.id || ""} />
      <input type="hidden" name="existing_image" value={story?.image_url || ""} />
      <Notice error={error} />
      <section className="editor-section"><div className="editor-section-title"><span>01</span><div><h2>Story details</h2><p>Basic publishing information</p></div></div><div className="form-grid three"><label>Category<select name="category" defaultValue={story?.category || "Pakistan"}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Author / Reporter<input name="author" required defaultValue={story?.author || "PDTV News Desk"} /></label><label>URL slug<input name="slug" defaultValue={story?.slug || ""} placeholder="generated-from-english-title" /></label></div><div className="form-grid two"><label className="checkbox-card"><input type="checkbox" name="is_breaking" defaultChecked={story?.is_breaking} /><span><strong>Breaking News</strong><small>Show in the red ticker</small></span></label><label className="checkbox-card"><input type="checkbox" name="is_lead" defaultChecked={story?.is_lead} /><span><strong>Lead Story</strong><small>Feature prominently on homepage</small></span></label></div></section>

      <LanguageFields code="en" title="English" dir="ltr" story={story} />
      <LanguageFields code="ur" title="اردو" dir="rtl" story={story} />
      <LanguageFields code="sd" title="سنڌي" dir="rtl" story={story} />

      <section className="editor-section"><div className="editor-section-title"><span>05</span><div><h2>Featured image</h2><p>JPG, PNG or WebP — maximum 5 MB</p></div></div>{story?.image_url && <div className="current-image"><Image src={story.image_url} alt="Current story image" fill sizes="320px" /></div>}<label className="upload-box">Choose new image<input type="file" name="image" accept="image/jpeg,image/png,image/webp" /></label></section>
      <div className="form-actions"><button className="secondary-button" name="intent" value="draft"><Save size={18} /> Save Draft</button><button className="primary-button" name="intent" value="publish"><Send size={18} /> Publish Story</button></div>
    </form>
  );
}

function LanguageFields({ code, title, dir, story }: { code: "en" | "ur" | "sd"; title: string; dir: "ltr" | "rtl"; story?: Story | null }) {
  const number = code === "en" ? "02" : code === "ur" ? "03" : "04";
  return (
    <section className="editor-section" dir={dir}><div className="editor-section-title"><span>{number}</span><div><h2>{title} content</h2><p>Headline, summary and full report</p></div></div><label>Headline<input name={`title_${code}`} required defaultValue={story?.[`title_${code}`] || ""} /></label><label>Short summary<textarea name={`summary_${code}`} required rows={3} defaultValue={story?.[`summary_${code}`] || ""} /></label><label>Full news body<textarea name={`body_${code}`} required rows={10} defaultValue={story?.[`body_${code}`] || ""} /></label></section>
  );
}

