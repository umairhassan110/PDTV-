# PDTV — Pakistan Diamond Television

Multilingual Next.js news website for Vercel with English, Urdu and Sindhi content, Supabase database/auth/storage, owner/editor newsroom, publishing workflow, SEO and the automated **PDTV AI Newsroom**.

## Main features

- English, Urdu and Sindhi with RTL support
- Responsive broadcast-news homepage and article pages
- Breaking ticker, lead story and category filtering
- Owner/editor authentication through Supabase
- Manual story creation, drafts, publish/unpublish and image upload
- SEO metadata, structured NewsArticle data, sitemap and robots.txt
- AI Newsroom for Pakistan, Sindh, World, Business, Sports and Technology
- Free news discovery using GDELT plus RSS discovery — no paid news API subscription required
- Multiple-source clustering and duplicate reduction
- Evidence-constrained AI writing: no full publisher article is copied into PDTV
- English → Urdu → Sindhi generation in one automated newsroom step
- Text-similarity risk checker and automatic rewrite attempt when similarity is high
- Verification score, uncertainty/risk flags and source links before approval
- Wikimedia Commons image search restricted to explicit free/public-domain licenses
- Image author, source and license metadata retained
- Human approval required before an AI story is published
- GitHub Actions scheduler included for hourly automation on Vercel Hobby

---

# One-time setup

The application code is complete, but external accounts still need their own secret keys. **Do not put real keys in GitHub source files.**

## 1. Supabase database

If this PDTV project is already running, `001_initial_schema.sql` has already been applied.

Open **Supabase → SQL Editor** and run this new file once:

```text
supabase/migrations/002_ai_newsroom.sql
```

It adds the AI draft queue, run history, source provenance and image-license fields without deleting existing stories.

For a completely new Supabase project, run in this order:

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_ai_newsroom.sql
```

## 2. Create a free Gemini API key

Create a Gemini API key in Google AI Studio. The default model in this project is:

```text
gemini-3.1-flash-lite
```

It is selected because it has a free tier and supports structured JSON output. Free-tier quotas can change, so the newsroom deliberately batches multiple stories into one AI request.

## 3. Vercel Environment Variables

Keep the existing PDTV variables and add the AI variables below.

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=https://YOUR_FINAL_DOMAIN
OWNER_EMAIL=your-email@example.com

GEMINI_API_KEY=YOUR_GOOGLE_AI_STUDIO_KEY
GEMINI_MODEL=gemini-3.1-flash-lite
CRON_SECRET=USE_A_LONG_RANDOM_SECRET
MAX_AI_STORIES_PER_RUN=4
```

`CRON_SECRET` can be any long random value. Example generation command in PowerShell:

```powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

Never expose these publicly:

```text
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
CRON_SECRET
```

## 4. GitHub Actions automation — every 60 minutes

Vercel Hobby cron is limited to once per day, so this project includes:

```text
.github/workflows/ai-newsroom.yml
```

In the GitHub repository open:

**Settings → Secrets and variables → Actions → New repository secret**

Create exactly these two secrets:

```text
PDTV_SITE_URL
```

Value example:

```text
https://www.pdtv.me
```

Then:

```text
PDTV_CRON_SECRET
```

Its value must be **exactly the same** as the Vercel `CRON_SECRET` value.

The included workflow calls the protected endpoint every 60 minutes. The API route is configured for a 300-second Vercel Function ceiling so slow network/AI calls have room to finish:

```text
POST /api/ai-newsroom/run
Authorization: Bearer <CRON_SECRET>
```

You can also run it manually from GitHub Actions or from the PDTV Admin panel.

---

# How the AI Newsroom works

```text
GDELT + RSS discovery
        ↓
Category filtering
        ↓
Duplicate/story clustering
        ↓
Multiple-source evidence
        ↓
Gemini factual draft
        ↓
English + Urdu + Sindhi
        ↓
Text-similarity risk check
        ↓
Auto-rewrite if similarity is high
        ↓
Wikimedia Commons license check
        ↓
Ready / Needs Review
        ↓
Owner or editor approves
        ↓
Published on PDTV
```

The system does **not** treat an AI score as a legal copyright clearance. Instead it reduces risk by not feeding full publisher articles into the writer, constraining generation to evidence, checking phrase similarity, storing source links and using only explicit free-license/public-domain image results from Wikimedia Commons.

## Admin routes

```text
/admin                 Existing newsroom
/admin/ai-newsroom     AI draft queue
```

Each AI draft shows:

- category
- verification score
- text similarity risk
- source count and source links
- verified facts
- uncertainty/risk flags
- image license/credit
- English, Urdu and Sindhi previews
- Approve & Publish
- Reject

AI-generated stories are **never automatically published**. Final editorial control remains in the newsroom.

---

# Existing owner/editor setup

## Owner activation

Open:

```text
/admin/login?mode=activate
```

Use the same email stored in `OWNER_EMAIL`.

## Editors

The owner can approve editors from:

```text
/admin/editors
```

Approved editors activate their own account and password.

---

# Local development

Create `.env.local` from `.env.example` and add your own private values.

```bash
npm install
npm run dev
```

Website:

```text
http://localhost:3000
```

Newsroom:

```text
http://localhost:3000/admin
```

AI Newsroom:

```text
http://localhost:3000/admin/ai-newsroom
```

For a manual protected API test:

```bash
curl -X POST http://localhost:3000/api/ai-newsroom/run \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

# Deployment

1. Push the project to GitHub.
2. Import/update it in Vercel.
3. Add all Vercel Environment Variables listed above.
4. Run `002_ai_newsroom.sql` in Supabase once.
5. Add the two GitHub Actions secrets.
6. Redeploy.
7. Open `/admin/ai-newsroom` and press **Collect & prepare now** for the first manual test.
8. After that, GitHub Actions handles the hourly schedule.

---

# Security notes

- `.env.local` is ignored by Git and must remain private.
- Service-role, Gemini and cron secrets are server-only.
- The cron API requires a bearer secret.
- AI database tables have RLS enabled and no public policies.
- Staff pages still require the existing PDTV authentication.
- Public users can only read published stories through the existing site flow.
- AI drafts remain private until approved.

# Important operating note

This version is designed to run without a paid news-data subscription. GDELT, RSS discovery, Wikimedia Commons and the Gemini free tier remove the need for a monthly news API subscription at the current scale. Free services have quotas/availability rules and can change in the future; the code is modular so a source/model can be replaced without rebuilding the PDTV publishing system.
