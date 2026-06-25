-- ============================================================
-- Migration 002: admin_allowlist table + initial seed
-- Run AFTER 001_profiles.sql
-- ============================================================

-- Admin allowlist: these emails bypass domain restriction and are auto-activated as admins
CREATE TABLE IF NOT EXISTS public.admin_allowlist (
  email       TEXT        PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.admin_allowlist IS
  'Emails in this list bypass domain restriction on registration and are auto-set to role=admin, status=active by the handle_new_user trigger.';

-- Seed the initial admin accounts
-- Two are non-@moe.gov.my; they are domain-exempt via this list.
INSERT INTO public.admin_allowlist (email) VALUES
  ('wun@iegcampus.com'),
  ('mich88lim@gmail.com'),
  ('michelle.lim@moe.gov.my')
ON CONFLICT DO NOTHING;

-- Fallback: if these admins registered before this migration, promote them now.
UPDATE public.profiles
SET role = 'admin', status = 'active'
WHERE email IN ('wun@iegcampus.com', 'mich88lim@gmail.com', 'michelle.lim@moe.gov.my')
  AND (role != 'admin' OR status != 'active');
