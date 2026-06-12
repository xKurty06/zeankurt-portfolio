create extension if not exists "pgcrypto";

create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  slug text primary key,
  title text not null,
  description text not null,
  long_description text,
  tags text[] not null default '{}',
  github_url text,
  live_url text,
  image_path text,
  image_seed text,
  year text not null,
  role text not null,
  featured boolean not null default false,
  status text check (status is null or status in ('live', 'wip', 'archived')),
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.experience_items (
  slug text primary key,
  organization text not null,
  role text not null,
  period text not null,
  description text not null,
  type text not null check (type in ('work', 'community', 'hackathon')),
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  issuer text not null,
  issued text,
  expires text,
  image_path text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  slug text primary key,
  title text not null,
  event_date date not null,
  year text,
  venue text not null,
  organizers text,
  role text,
  category text check (category is null or category in ('community', 'hackathon', 'meetup', 'conference', 'workshop')),
  image_path text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skill_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.skill_categories(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, name)
);

create table if not exists public.site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.creative_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  showcase_image_path text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creative_photos (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.creative_categories(id) on delete cascade,
  title text not null,
  image_path text not null,
  aspect_ratio text not null default 'landscape' check (aspect_ratio in ('portrait', 'landscape', 'square')),
  featured boolean not null default false,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_public_idx on public.projects (published, featured desc, sort_order, year desc);
create index if not exists experience_public_idx on public.experience_items (published, sort_order);
create index if not exists certifications_public_idx on public.certifications (published, sort_order);
create index if not exists events_public_idx on public.events (published, event_date desc);
create index if not exists skill_categories_public_idx on public.skill_categories (published, sort_order);
create index if not exists skills_category_sort_idx on public.skills (category_id, sort_order);
create index if not exists creative_categories_public_idx on public.creative_categories (published, sort_order);
create index if not exists creative_photos_category_sort_idx on public.creative_photos (category_id, published, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists experience_updated_at on public.experience_items;
create trigger experience_updated_at
before update on public.experience_items
for each row execute function public.set_updated_at();

drop trigger if exists certifications_updated_at on public.certifications;
create trigger certifications_updated_at
before update on public.certifications
for each row execute function public.set_updated_at();

drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists skill_categories_updated_at on public.skill_categories;
create trigger skill_categories_updated_at
before update on public.skill_categories
for each row execute function public.set_updated_at();

drop trigger if exists skills_updated_at on public.skills;
create trigger skills_updated_at
before update on public.skills
for each row execute function public.set_updated_at();

drop trigger if exists site_content_updated_at on public.site_content;
create trigger site_content_updated_at
before update on public.site_content
for each row execute function public.set_updated_at();

drop trigger if exists creative_categories_updated_at on public.creative_categories;
create trigger creative_categories_updated_at
before update on public.creative_categories
for each row execute function public.set_updated_at();

drop trigger if exists creative_photos_updated_at on public.creative_photos;
create trigger creative_photos_updated_at
before update on public.creative_photos
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.projects enable row level security;
alter table public.experience_items enable row level security;
alter table public.certifications enable row level security;
alter table public.events enable row level security;
alter table public.skill_categories enable row level security;
alter table public.skills enable row level security;
alter table public.site_content enable row level security;
alter table public.creative_categories enable row level security;
alter table public.creative_photos enable row level security;

create policy "Public can read published projects"
on public.projects for select
to anon, authenticated
using (published = true);

create policy "Public can read published experience"
on public.experience_items for select
to anon, authenticated
using (published = true);

create policy "Public can read published certifications"
on public.certifications for select
to anon, authenticated
using (published = true);

create policy "Public can read published events"
on public.events for select
to anon, authenticated
using (published = true);

create policy "Public can read published skill categories"
on public.skill_categories for select
to anon, authenticated
using (published = true);

create policy "Public can read skills from published categories"
on public.skills for select
to anon, authenticated
using (
  exists (
    select 1 from public.skill_categories
    where skill_categories.id = skills.category_id
    and skill_categories.published = true
  )
);

create policy "Public can read site content"
on public.site_content for select
to anon, authenticated
using (true);

create policy "Public can read published creative categories"
on public.creative_categories for select
to anon, authenticated
using (published = true);

create policy "Public can read published creative photos"
on public.creative_photos for select
to anon, authenticated
using (
  published = true
  and exists (
    select 1 from public.creative_categories
    where creative_categories.id = creative_photos.category_id
    and creative_categories.published = true
  )
);

create policy "Admins can read admin users"
on public.admin_users for select
to authenticated
using (email = ((select auth.jwt()) ->> 'email'));

create policy "Admins can write admin users"
on public.admin_users for all
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where admin_users.email = ((select auth.jwt()) ->> 'email')
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where admin_users.email = ((select auth.jwt()) ->> 'email')
  )
);

create policy "Admins can write projects"
on public.projects for all
to authenticated
using (exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email')))
with check (exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email')));

create policy "Admins can write experience"
on public.experience_items for all
to authenticated
using (exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email')))
with check (exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email')));

create policy "Admins can write certifications"
on public.certifications for all
to authenticated
using (exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email')))
with check (exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email')));

create policy "Admins can write events"
on public.events for all
to authenticated
using (exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email')))
with check (exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email')));

create policy "Admins can write skill categories"
on public.skill_categories for all
to authenticated
using (exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email')))
with check (exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email')));

create policy "Admins can write skills"
on public.skills for all
to authenticated
using (exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email')))
with check (exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email')));

create policy "Admins can write site content"
on public.site_content for all
to authenticated
using (exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email')))
with check (exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email')));

create policy "Admins can write creative categories"
on public.creative_categories for all
to authenticated
using (exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email')))
with check (exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email')));

create policy "Admins can write creative photos"
on public.creative_photos for all
to authenticated
using (exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email')))
with check (exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email')));

insert into storage.buckets (id, name, public)
values ('portfolio-assets', 'portfolio-assets', true)
on conflict (id) do update set public = excluded.public;

create policy "Public can read portfolio assets"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'portfolio-assets');

create policy "Admins can upload portfolio assets"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'portfolio-assets'
  and exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email'))
);

create policy "Admins can update portfolio assets"
on storage.objects for update
to authenticated
using (
  bucket_id = 'portfolio-assets'
  and exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email'))
)
with check (
  bucket_id = 'portfolio-assets'
  and exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email'))
);

create policy "Admins can delete portfolio assets"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'portfolio-assets'
  and exists (select 1 from public.admin_users where email = ((select auth.jwt()) ->> 'email'))
);
