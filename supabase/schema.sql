-- ============================================================
-- Apex Meca - Supabase schema
-- Idempotent migration: safe to run repeatedly.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- portfolio ----------
create table if not exists public.portfolio (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  image_url text,
  video_url text,
  model_url text,
  document_url text,
  media_type text not null default 'image',
  description text,
  image_urls jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.portfolio add column if not exists model_url text;
alter table public.portfolio add column if not exists document_url text;
alter table public.portfolio add column if not exists media_type text not null default 'image';
alter table public.portfolio add column if not exists image_urls jsonb not null default '[]'::jsonb;
alter table public.portfolio add column if not exists tags text[] not null default '{}';
alter table public.portfolio add column if not exists sort_order integer not null default 0;
alter table public.portfolio drop constraint if exists portfolio_category_check;
alter table public.portfolio add constraint portfolio_category_check
  check (category in ('3D Models', 'Surfacing', 'Sheet Metal', 'Videos', 'Documents'));
alter table public.portfolio enable row level security;

create index if not exists portfolio_created_at_idx on public.portfolio (created_at desc);
create index if not exists portfolio_category_idx on public.portfolio (category, sort_order);

-- ---------- services ----------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null,
  description text,
  tags text[] not null default '{}',
  status text not null default 'active',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.services enable row level security;
create index if not exists services_sort_order_idx on public.services (sort_order, created_at);

-- ---------- software ----------
create table if not exists public.software (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  status text not null default 'active',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.software enable row level security;
create index if not exists software_sort_order_idx on public.software (sort_order, created_at);

-- ---------- social links ----------
create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  url text,
  subtext text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.social_links enable row level security;
create index if not exists social_links_sort_order_idx on public.social_links (sort_order, created_at);

-- ---------- experience and skills ----------
create table if not exists public.experience (
  id uuid primary key default gen_random_uuid(),
  year text not null,
  title text not null,
  type text not null default 'experience',
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.experience enable row level security;
create index if not exists experience_sort_order_idx on public.experience (sort_order desc, year desc);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  logo_url text,
  created_at timestamptz not null default now()
);
alter table public.skills enable row level security;
create index if not exists skills_name_idx on public.skills (name);

-- ---------- contact messages ----------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);

-- ---------- analytics ----------
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  target text,
  path text,
  created_at timestamptz not null default now()
);
alter table public.analytics_events enable row level security;
create index if not exists analytics_events_type_idx on public.analytics_events (event_type, created_at desc);
create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);

-- ---------- public read policies ----------
drop policy if exists "Public can read portfolio items" on public.portfolio;
create policy "Public can read portfolio items"
  on public.portfolio for select using (true);

drop policy if exists "Public can read services" on public.services;
create policy "Public can read services"
  on public.services for select using (true);

drop policy if exists "Public can read software" on public.software;
create policy "Public can read software"
  on public.software for select using (true);

drop policy if exists "Public can read social links" on public.social_links;
create policy "Public can read social links"
  on public.social_links for select using (true);

drop policy if exists "Public can read experience" on public.experience;
create policy "Public can read experience"
  on public.experience for select using (true);

drop policy if exists "Public can read skills" on public.skills;
create policy "Public can read skills"
  on public.skills for select using (true);

-- ---------- authenticated CMS write policies ----------
drop policy if exists "Authenticated users can insert portfolio items" on public.portfolio;
create policy "Authenticated users can insert portfolio items"
  on public.portfolio for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update portfolio items" on public.portfolio;
create policy "Authenticated users can update portfolio items"
  on public.portfolio for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete portfolio items" on public.portfolio;
create policy "Authenticated users can delete portfolio items"
  on public.portfolio for delete to authenticated using (true);

drop policy if exists "Authenticated users can write services" on public.services;
create policy "Authenticated users can write services"
  on public.services for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can write software" on public.software;
create policy "Authenticated users can write software"
  on public.software for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can write social links" on public.social_links;
create policy "Authenticated users can write social links"
  on public.social_links for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can write experience" on public.experience;
create policy "Authenticated users can write experience"
  on public.experience for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can write skills" on public.skills;
create policy "Authenticated users can write skills"
  on public.skills for all to authenticated using (true) with check (true);

-- ---------- contact and analytics policies ----------
drop policy if exists "Anyone can submit a contact message" on public.contact_messages;
create policy "Anyone can submit a contact message"
  on public.contact_messages for insert to anon, authenticated with check (true);

drop policy if exists "Authenticated users can read contact messages" on public.contact_messages;
create policy "Authenticated users can read contact messages"
  on public.contact_messages for select to authenticated using (true);

drop policy if exists "Anyone can record analytics" on public.analytics_events;
create policy "Anyone can record analytics"
  on public.analytics_events for insert to anon, authenticated with check (true);

drop policy if exists "Authenticated users can read analytics" on public.analytics_events;
create policy "Authenticated users can read analytics"
  on public.analytics_events for select to authenticated using (true);

-- ---------- storage ----------
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can view portfolio images" on storage.objects;
create policy "Public can view portfolio images"
  on storage.objects for select using (bucket_id = 'portfolio');

drop policy if exists "Authenticated users can upload portfolio images" on storage.objects;
create policy "Authenticated users can upload portfolio images"
  on storage.objects for insert to authenticated with check (bucket_id = 'portfolio');

drop policy if exists "Authenticated users can update portfolio images" on storage.objects;
create policy "Authenticated users can update portfolio images"
  on storage.objects for update to authenticated using (bucket_id = 'portfolio') with check (bucket_id = 'portfolio');

drop policy if exists "Authenticated users can delete portfolio images" on storage.objects;
create policy "Authenticated users can delete portfolio images"
  on storage.objects for delete to authenticated using (bucket_id = 'portfolio');

-- ---------- default CMS content ----------
insert into public.services (code, title, description, tags, status, sort_order)
select code, title, description, tags, status, sort_order
from (values
  ('CAD', 'Mechanical CAD Modeling', 'Precision 3D modeling, complex surfacing and sheet-metal design in SolidWorks.', array['3D Modeling','Surfacing','Sheet Metal'], 'active', 10),
  ('CAM', 'CAM Programming', 'Toolpath generation and machining strategy for CNC production.', array['Mastercam','ESPRIT','Toolpaths'], 'soon', 20),
  ('FEA', 'Finite Element Analysis', 'Structural simulation to validate part strength and fatigue life.', array['Static Stress','Fatigue','Optimization'], 'soon', 30),
  ('CFD', 'Computational Fluid Dynamics', 'Flow and thermal simulation for parts and assemblies.', array['Flow Analysis','Thermal','Aerodynamics'], 'soon', 40)
) as defaults(code, title, description, tags, status, sort_order)
where not exists (select 1 from public.services);

insert into public.software (name, logo_url, status, sort_order)
select name, logo_url, status, sort_order
from (values
  ('SolidWorks', '/assets/logos/logo-solidworks.jpg', 'active', 10),
  ('CATIA', '/assets/logos/logo-catia.png', 'soon', 20),
  ('Mastercam', '/assets/logos/logo-mastercam.png', 'soon', 30),
  ('ESPRIT', '/assets/logos/logo-esprit.png', 'soon', 40)
) as defaults(name, logo_url, status, sort_order)
where not exists (select 1 from public.software);

insert into public.social_links (slug, label, url, subtext, sort_order)
select slug, label, url, subtext, sort_order
from (values
  ('email', 'Email', 'mailto:sallahi.haytam.officiel@gmail.com', '', 10),
  ('whatsapp', 'WhatsApp', 'https://wa.me/212681368537', '', 20),
  ('linkedin', 'LinkedIn', 'https://www.linkedin.com/in/haytam-sallahi-6440b5376/', '', 30),
  ('behance', 'Behance', 'https://www.behance.net/SallahiHaytam', '', 40),
  ('facebook', 'Facebook', 'https://www.facebook.com/apexmeca', '', 50),
  ('fiverr', 'Fiverr', 'https://www.fiverr.com/mega_craft_3d/buying?source=avatar_menu_profile', '', 60)
) as defaults(slug, label, url, subtext, sort_order)
where not exists (select 1 from public.social_links);

insert into public.experience (year, title, type, description, sort_order)
select year, title, type, description, sort_order
from (values
  ('2025 - Present', 'Régleur Machine CNC | AHG ATELIERS DE LA HAUTE GARONNE', 'experience', 'Setting up CNC machines, mounting tools, setting origins, reading technical drawings, and quality control.', 50),
  ('March 2025', 'Opérateur Machine CNC | USINAGE SKHIRAT', 'internship', 'Loading and unloading CNC machining centers, monitoring series production.', 40),
  ('June 2024', 'Opérateur en Usinage Conventionnel | AT Metal Temara', 'internship', 'Conventional machining of single parts, manual machining operations, and dimensional inspection.', 30),
  ('2023 - 2025', 'Diplôme de TS en Génie Mécanique | ISTA Yacoub El Mansour, Rabat', 'education', 'Grade: 16.46/20.', 20),
  ('2022 - 2023', 'Baccalauréat en Sciences Physiques | Lycée Mers El Kheir, Temara', 'education', null, 10)
) as defaults(year, title, type, description, sort_order)
where not exists (select 1 from public.experience);

-- Create the admin user manually in Supabase Authentication. Do not enable public sign-ups.
