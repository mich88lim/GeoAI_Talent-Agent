-- ============================================================
-- Migration 006: Schema grants
-- PostgreSQL 15 no longer auto-grants public schema access.
-- Run in Supabase SQL Editor.
-- ============================================================

-- Allow all three API roles to use the public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- service_role: full access to all tables and sequences (bypasses RLS)
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- authenticated: row-level access (RLS policies apply)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT                  ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- anon: read-only (only public-facing tables; RLS applies)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Ensure future tables also get these grants automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL              ON TABLES    TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL              ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES    TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT   ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT          ON TABLES    TO anon;
