-- PromptJump Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Categories Table
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text default '',
  icon_url text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Subscription Plans Table
create table if not exists subscription_plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  monthly_price numeric,
  yearly_price numeric,
  price numeric default 0,
  billing_period text default 'both',
  features jsonb default '[]'::jsonb,
  limits jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table subscription_plans add column if not exists limits jsonb default '{}'::jsonb;

-- 4. Prompts Table
create table if not exists prompts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text default '',
  type text not null check (type in ('Image', 'Video')),
  media_url text not null,
  thumbnail text not null,
  category text default 'General',
  tags text[] default '{}',
  access text default 'Free' check (access in ('Free', 'Pro', 'Team', 'Unassigned')),
  status text default 'Published' check (status in ('Published', 'Draft', 'Archived')),
  views integer default 0,
  downloads integer default 0,
  likes integer default 0,
  copies integer default 0,
  is_trending boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Users Table
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  password_salt text not null,
  role text default 'user' check (role in ('user', 'admin')),
  status text default 'active' check (status in ('active', 'inactive')),
  subscription text default 'Free' check (subscription in ('Free', 'Pro', 'Team')),
  username text unique,
  avatar_url text default '',
  preferences jsonb default '{"showTrendingOnDashboard": true, "enablePromptSuggestions": true}'::jsonb,
  email_notifications jsonb default '{"productUpdates": true, "weeklyNewsletter": false, "promptOffers": true}'::jsonb,
  appearance jsonb default '{"theme": "light"}'::jsonb,
  billing jsonb default '{"planId": "", "planName": "Free", "planPrice": 0, "billingPeriod": "none", "status": "free", "invoices": []}'::jsonb,
  daily_usage jsonb default '{"date": "", "imageCopies": 0, "videoCopies": 0}'::jsonb,
  reset_token text,
  reset_token_expiry timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. User Saved Prompts (Join Table)
create table if not exists user_saved_prompts (
  user_id uuid references users(id) on delete cascade,
  prompt_id uuid references prompts(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (user_id, prompt_id)
);

-- 7. User Liked Prompts (Join Table)
create table if not exists user_liked_prompts (
  user_id uuid references users(id) on delete cascade,
  prompt_id uuid references prompts(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (user_id, prompt_id)
);

-- 8. Announcements Table
create table if not exists announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  message text not null,
  audience text default 'all' check (audience in ('all', 'Free', 'Pro', 'Team')),
  status text default 'Published' check (status in ('Draft', 'Published')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Seed Default Categories
insert into categories (name, description) values
  ('General', 'Uncategorized prompts'),
  ('Marketing', 'Ads, campaigns, and copy'),
  ('Design', 'Visual and UI creative work'),
  ('Writing', 'Articles, scripts, and stories')
on conflict (name) do nothing;

-- Seed Default Subscription Plans
insert into subscription_plans (name, monthly_price, yearly_price, price, billing_period, features, limits, is_active) values
  ('Free', 0, 0, 0, 'both', '["Access to Free prompts", "Daily copy limits", "Save and favorite prompts"]'::jsonb, '{"dailyImageCopies":6,"dailyVideoCopies":4,"maxSaves":6,"savesImagesOnly":true,"maxFavorites":20,"historyUnlimited":true,"allowedAccess":["Free"],"resetCadence":"Daily"}'::jsonb, true),
  ('Pro', 12, 120, 12, 'both', '["All Free features", "Access to Pro prompts", "Higher daily copy limits"]'::jsonb, '{"dailyImageCopies":null,"dailyVideoCopies":null,"maxSaves":null,"savesImagesOnly":false,"maxFavorites":null,"historyUnlimited":true,"allowedAccess":["Free","Pro"]}'::jsonb, true),
  ('Team', 29, 290, 29, 'both', '["All Pro features", "Team-tier prompts", "Highest usage limits"]'::jsonb, '{"dailyImageCopies":null,"dailyVideoCopies":null,"maxSaves":null,"savesImagesOnly":false,"maxFavorites":null,"historyUnlimited":true,"allowedAccess":["Free","Pro","Team"]}'::jsonb, true)
on conflict do nothing;
