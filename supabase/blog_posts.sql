-- Run this once in Supabase Dashboard > SQL Editor.
-- It is safe to run repeatedly and fixes the schema-cache error for /admin.

create extension if not exists pgcrypto;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  published_at timestamptz not null default now(),
  tags text[] not null default '{}',
  excerpt text,
  cover_image text,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'blog_posts' and column_name = 'publish_date')
    and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'blog_posts' and column_name = 'published_at') then
    alter table public.blog_posts rename column publish_date to published_at;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'blog_posts' and column_name = 'cover_image_url')
    and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'blog_posts' and column_name = 'cover_image') then
    alter table public.blog_posts rename column cover_image_url to cover_image;
  end if;
end $$;

alter table public.blog_posts add column if not exists published_at timestamptz;
alter table public.blog_posts add column if not exists tags text[] not null default '{}';
alter table public.blog_posts add column if not exists excerpt text;
alter table public.blog_posts add column if not exists cover_image text;
alter table public.blog_posts add column if not exists content text not null default '';
alter table public.blog_posts add column if not exists created_at timestamptz not null default now();
alter table public.blog_posts add column if not exists updated_at timestamptz not null default now();
update public.blog_posts set published_at = coalesce(published_at, now()) where published_at is null;
alter table public.blog_posts alter column published_at set default now();
alter table public.blog_posts alter column published_at set not null;

alter table public.blog_posts enable row level security;

drop policy if exists "Public can read blog posts" on public.blog_posts;
create policy "Public can read blog posts"
  on public.blog_posts for select using (true);

drop policy if exists "Authenticated users can insert blog posts" on public.blog_posts;
create policy "Authenticated users can insert blog posts"
  on public.blog_posts for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update blog posts" on public.blog_posts;
create policy "Authenticated users can update blog posts"
  on public.blog_posts for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete blog posts" on public.blog_posts;
create policy "Authenticated users can delete blog posts"
  on public.blog_posts for delete to authenticated using (true);

create index if not exists blog_posts_published_at_idx on public.blog_posts (published_at desc);