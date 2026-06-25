-- ============================================================
-- Migration 001: profiles table
-- Run in Supabase SQL editor (Database > SQL editor)
-- ============================================================

-- Enable uuid-ossp if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (one row per auth user)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        TEXT,
  email            TEXT        NOT NULL,
  role             TEXT        NOT NULL DEFAULT 'user'
                               CHECK (role IN ('admin', 'user')),
  ppd_district     TEXT,
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'active', 'suspended')),
  preferred_language TEXT      NOT NULL DEFAULT 'bm'
                               CHECK (preferred_language IN ('en', 'bm')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'One row per auth.users account; drives role-based access and district scoping.';
COMMENT ON COLUMN public.profiles.status IS 'pending = awaiting admin approval; active = can use the system; suspended = locked out.';
COMMENT ON COLUMN public.profiles.ppd_district IS 'District assignment set by admin; NULL for state-wide JPN admins.';
