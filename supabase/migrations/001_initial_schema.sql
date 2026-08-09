create extension if not exists "pgcrypto";
create extension if not exists "citext";

do $$ begin
  create type public.staff_role as enum ('owner', 'editor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.story_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  email citext unique not null,
  full_name text not null,
  role public.staff_role not null default 'editor',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_en text not null,
  title_ur text not null,
  title_sd text not null,
  summary_en text not null,
  summary_ur text not null,
  summary_sd text not null,
  body_en text not null,
  body_ur text not null,
  body_sd text not null,
  category text not null default 'Pakistan',
  author text not null default 'PDTV News Desk',
  image_url text,
  status public.story_status not null default 'draft',
  is_breaking boolean not null default false,
  is_lead boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stories_status_published_idx on public.stories(status, published_at desc);
create index if not exists stories_category_idx on public.stories(category);

alter table public.profiles enable row level security;
alter table public.stories enable row level security;

drop policy if exists "Published stories are public" on public.stories;
create policy "Published stories are public" on public.stories for select using (status = 'published');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('news-images', 'news-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Public can view news images" on storage.objects;
create policy "Public can view news images" on storage.objects for select using (bucket_id = 'news-images');

