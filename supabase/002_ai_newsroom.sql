alter table public.stories
add column if not exists source_links jsonb
not null default '[]'::jsonb;

alter table public.stories
add column if not exists image_credit text;

alter table public.stories
add column if not exists image_source_url text;

alter table public.stories
add column if not exists image_license text;

alter table public.stories
add column if not exists image_license_url text;

alter table public.stories
add column if not exists image_is_illustrative boolean
not null default false;

do $$
begin
  create type public.ai_news_status as enum (
    'ready',
    'needs_review',
    'approved',
    'rejected',
    'failed'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.ai_news_drafts (
  id uuid primary key default gen_random_uuid(),

  fingerprint text unique not null,

  category text not null,
  discovery_title text not null,

  source_items jsonb not null default '[]'::jsonb,
  verified_facts jsonb not null default '[]'::jsonb,
  uncertain_points jsonb not null default '[]'::jsonb,

  title_en text not null,
  title_ur text not null,
  title_sd text not null,

  summary_en text not null,
  summary_ur text not null,
  summary_sd text not null,

  body_en text not null,
  body_ur text not null,
  body_sd text not null,

  verification_score integer not null default 0
    check (verification_score between 0 and 100),

  verification_notes text not null default '',

  similarity_score integer not null default 0
    check (similarity_score between 0 and 100),

  similarity_phrases jsonb not null default '[]'::jsonb,

  risk_flags jsonb not null default '[]'::jsonb,

  image_query text,
  image_url text,
  image_source_url text,
  image_author text,
  image_license text,
  image_license_url text,

  image_is_illustrative boolean not null default false,

  status public.ai_news_status not null default 'needs_review',

  story_id uuid
    references public.stories(id)
    on delete set null,

  reviewed_by uuid
    references public.profiles(id)
    on delete set null,

  reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_news_drafts_status_created_idx
on public.ai_news_drafts(status, created_at desc);

create index if not exists ai_news_drafts_category_idx
on public.ai_news_drafts(category, created_at desc);

create table if not exists public.ai_news_runs (
  id uuid primary key default gen_random_uuid(),

  status text not null default 'running',

  discovered integer not null default 0,
  selected integer not null default 0,
  ready integer not null default 0,
  needs_review integer not null default 0,

  errors jsonb not null default '[]'::jsonb,

  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ai_news_runs_started_idx
on public.ai_news_runs(started_at desc);

alter table public.ai_news_drafts enable row level security;
alter table public.ai_news_runs enable row level security;

drop policy if exists "Staff can view AI drafts"
on public.ai_news_drafts;

drop policy if exists "Staff can manage AI drafts"
on public.ai_news_drafts;

drop policy if exists "Staff can view AI runs"
on public.ai_news_runs;

drop policy if exists "Staff can manage AI runs"
on public.ai_news_runs;