-- ============================================================
-- Migration 004: Row-Level Security policies
-- Run AFTER 003_functions_triggers.sql
-- ============================================================

-- ─── profiles ────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: own row OR any row if admin
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- INSERT: handle_new_user trigger runs as SECURITY DEFINER (bypasses RLS).
-- Also allow authenticated users to insert their own row (edge-case recovery).
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: own row OR any row if admin.
-- The enforce_profile_rules trigger blocks self-promotion regardless.
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- DELETE: admin only (soft-delete preferred, but allow hard delete if needed)
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  USING (public.is_admin());

-- ─── admin_allowlist ─────────────────────────────────────────
ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

-- Only active admins can read or manage the allowlist
CREATE POLICY "allowlist_admin_only"
  ON public.admin_allowlist FOR ALL
  USING (public.is_admin());

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS profiles_email_idx        ON public.profiles (email);
CREATE INDEX IF NOT EXISTS profiles_status_idx       ON public.profiles (status);
CREATE INDEX IF NOT EXISTS profiles_role_idx         ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_ppd_district_idx ON public.profiles (ppd_district);
