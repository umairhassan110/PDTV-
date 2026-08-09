# PDTV — Pakistan Diamond Television

Complete multilingual news website for Vercel with English, Urdu and Sindhi content, Supabase database, secure owner/editor authentication, drafts, publishing, direct image upload, SEO, sitemap and responsive design.

## Features

- English, Urdu and Sindhi with RTL support
- Premium responsive broadcast-news homepage
- Breaking-news ticker, lead story, latest and most-read sections
- Separate SEO-friendly article pages
- Owner and approved-editor login
- Editor activation without sharing passwords
- Create, edit, draft, publish, unpublish and safely delete drafts
- Direct image upload to Supabase Storage
- Automatic `sitemap.xml` and `robots.txt`
- GitHub and Vercel ready

## Aasan setup — Roman Urdu

### 1. Supabase project banayein

1. `https://supabase.com` par account banayein.
2. **New Project** select karein.
3. Project ka naam `pdtv` rakhein aur database password safely save karein.
4. Project ready hone ke baad **SQL Editor** kholen.
5. `supabase/migrations/001_initial_schema.sql` file ka poora code copy karke SQL Editor mein paste karein.
6. **Run** dabayein. Is se database tables aur image bucket ban jayegi.

### 2. Supabase keys hasil karein

Supabase dashboard mein **Project Settings → API Keys** kholen. Ye values chahiye:

- Project URL
- Publishable/anon key
- Service role key — isko kabhi public ya GitHub par upload na karein

### 3. Local testing

`.env.example` ko copy karke `.env.local` banayein aur values fill karein:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OWNER_EMAIL=your-real-email@gmail.com
```

Commands:

```bash
npm install
npm run dev
```

Website `http://localhost:3000` par aur Newsroom `http://localhost:3000/admin` par khulega.

### 4. Owner account activate karein

1. `/admin/login?mode=activate` kholen.
2. Wohi email likhein jo `OWNER_EMAIL` mein set ki hai.
3. Apna password khud banayein. Password PDTV code mein save nahi hota; Supabase secure hash manage karta hai.
4. Agar Supabase email confirmation on hai to inbox se confirmation link click karein.

### 5. GitHub par upload

GitHub mein new empty repository `pdtv-news` banayein. Is project ki saari files upload karein, lekin `.env.local` kabhi upload na karein.

```bash
git init
git add .
git commit -m "Initial PDTV website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pdtv-news.git
git push -u origin main
```

### 6. Vercel deployment

1. `https://vercel.com` kholen aur GitHub se login karein.
2. **Add New → Project** select karein.
3. `pdtv-news` repository import karein.
4. **Environment Variables** mein ye five variables add karein:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` — pehle Vercel URL, domain lagne ke baad final domain
   - `OWNER_EMAIL`
5. **Deploy** dabayein.

Domain lagne ke baad `NEXT_PUBLIC_SITE_URL=https://yourdomain.com` update karke **Redeploy** karein.

### 7. Cloudflare domain Vercel ke saath connect

1. Vercel project → **Settings → Domains** mein apna domain aur `www` domain add karein.
2. Vercel jo exact A/CNAME records dikhaye unko Cloudflare → **DNS → Records** mein add karein.
3. Shuru mein Cloudflare proxy **DNS only / grey cloud** rakhein.
4. Purane conflicting A, AAAA ya CNAME records remove karein.
5. Vercel mein **Verify** karein. SSL automatically activate ho jayega.

## Editor workflow

1. Owner Newsroom → **Editors** mein editor ka naam aur email approve karega.
2. Editor `/admin/login?mode=activate` par apna password khud banayega.
3. Editor stories draft/publish kar sakta hai.
4. Sirf owner editor access add/remove kar sakta hai.
5. Published story direct delete nahi hoti; pehle unpublish, phir draft delete hota hai.

## Important security notes

- `.env.local` GitHub par upload na karein.
- `SUPABASE_SERVICE_ROLE_KEY` sirf Vercel Environment Variables mein rakhein.
- Supabase Auth → URL Configuration mein final website URL aur `/admin` redirect allow karein.
- Supabase Auth mein production se pehle email confirmation aur rate limits check karein.

