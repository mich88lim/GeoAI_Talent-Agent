-- ============================================================
-- Migration 014: Multi-select skill/subject filter
-- Updates fn_trainer_heatmap, fn_trainer_pins, and
-- fn_available_trainers to accept INTEGER[] so the UI can
-- filter by more than one skill or subject at once.
--
-- Safe to re-run (CREATE OR REPLACE).
-- Run in Supabase SQL Editor.
-- ============================================================

-- ── fn_trainer_heatmap ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_trainer_heatmap(
  p_item_ids    INTEGER[] DEFAULT NULL,
  p_center_lat  FLOAT     DEFAULT NULL,
  p_center_long FLOAT     DEFAULT NULL,
  p_radius_km   FLOAT     DEFAULT NULL
)
RETURNS TABLE (lat FLOAT, lng FLOAT)
LANGUAGE sql STABLE
AS $$
  SELECT mt.workstation_lat, mt.workstation_long
  FROM   master_trainers mt
  WHERE  mt.workstation_lat  IS NOT NULL
    AND  mt.workstation_long IS NOT NULL
    AND (
      p_item_ids IS NULL
      OR array_length(p_item_ids, 1) IS NULL
      OR EXISTS (
        SELECT 1 FROM trainer_skills ts
        WHERE  ts.trainer_id = mt.trainer_id
          AND  ts.item_id    = ANY(p_item_ids)
      )
    )
    AND (
      p_center_lat  IS NULL OR p_center_long IS NULL OR p_radius_km IS NULL
      OR ST_DWithin(
           mt.workstation_geom::geography,
           ST_SetSRID(ST_MakePoint(p_center_long, p_center_lat), 4326)::geography,
           p_radius_km * 1000
         )
    );
$$;

GRANT EXECUTE ON FUNCTION public.fn_trainer_heatmap TO authenticated, service_role;

-- ── fn_trainer_pins ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_trainer_pins(
  p_item_ids    INTEGER[] DEFAULT NULL,
  p_center_lat  FLOAT     DEFAULT NULL,
  p_center_long FLOAT     DEFAULT NULL,
  p_radius_km   FLOAT     DEFAULT NULL
)
RETURNS TABLE (
  trainer_id   TEXT,
  trainer_name TEXT,
  school_name  TEXT,
  ppd_district TEXT,
  lat          FLOAT,
  lng          FLOAT,
  skills       TEXT[],
  subjects     TEXT[],
  roles        TEXT[]
)
LANGUAGE sql STABLE
AS $$
  SELECT
    mt.trainer_id,
    mt.trainer_name,
    s.school_name,
    mt.ppd_district,
    mt.workstation_lat,
    mt.workstation_long,
    ARRAY(
      SELECT ss.name_en FROM trainer_skills ts
      JOIN   skills_subjects ss ON ss.item_id = ts.item_id
      WHERE  ts.trainer_id = mt.trainer_id AND ss.type = 'SKILL'
      ORDER BY ss.name_en
    ) AS skills,
    ARRAY(
      SELECT ss.name_en FROM trainer_skills ts
      JOIN   skills_subjects ss ON ss.item_id = ts.item_id
      WHERE  ts.trainer_id = mt.trainer_id AND ss.type = 'SUBJECT'
      ORDER BY ss.name_en
    ) AS subjects,
    ARRAY(
      SELECT tr.role FROM trainer_roles tr
      WHERE  tr.trainer_id = mt.trainer_id
      ORDER BY tr.role
    ) AS roles
  FROM master_trainers mt
  LEFT JOIN schools s ON s.school_code = mt.workstation_school_code
  WHERE  mt.workstation_lat  IS NOT NULL
    AND  mt.workstation_long IS NOT NULL
    AND (
      p_item_ids IS NULL
      OR array_length(p_item_ids, 1) IS NULL
      OR EXISTS (
        SELECT 1 FROM trainer_skills ts
        WHERE  ts.trainer_id = mt.trainer_id
          AND  ts.item_id    = ANY(p_item_ids)
      )
    )
    AND (
      p_center_lat  IS NULL OR p_center_long IS NULL OR p_radius_km IS NULL
      OR ST_DWithin(
           mt.workstation_geom::geography,
           ST_SetSRID(ST_MakePoint(p_center_long, p_center_lat), 4326)::geography,
           p_radius_km * 1000
         )
    );
$$;

GRANT EXECUTE ON FUNCTION public.fn_trainer_pins TO authenticated, service_role;

-- ── fn_available_trainers ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_available_trainers(
  p_venue_lat    DOUBLE PRECISION,
  p_venue_long   DOUBLE PRECISION,
  p_radius_km    DOUBLE PRECISION DEFAULT 50,
  p_start_date   DATE             DEFAULT NULL,
  p_end_date     DATE             DEFAULT NULL,
  p_item_ids     INTEGER[]        DEFAULT NULL
)
RETURNS TABLE (
  trainer_id         TEXT,
  trainer_name       TEXT,
  school_name        TEXT,
  ppd_district       TEXT,
  lat                DOUBLE PRECISION,
  lng                DOUBLE PRECISION,
  skills             TEXT[],
  subjects           TEXT[],
  roles              TEXT[],
  accessibility_tier TEXT,
  straight_line_km   NUMERIC(8,2)
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    mt.trainer_id,
    mt.trainer_name,
    s.school_name,
    mt.ppd_district,
    mt.workstation_lat,
    mt.workstation_long,
    ARRAY(
      SELECT ss.name_en FROM trainer_skills ts
      JOIN   skills_subjects ss ON ss.item_id = ts.item_id
      WHERE  ts.trainer_id = mt.trainer_id AND ss.type = 'SKILL'
      ORDER BY ss.name_en
    ) AS skills,
    ARRAY(
      SELECT ss.name_en FROM trainer_skills ts
      JOIN   skills_subjects ss ON ss.item_id = ts.item_id
      WHERE  ts.trainer_id = mt.trainer_id AND ss.type = 'SUBJECT'
      ORDER BY ss.name_en
    ) AS subjects,
    ARRAY(
      SELECT tr.role FROM trainer_roles tr
      WHERE  tr.trainer_id = mt.trainer_id
      ORDER BY tr.role
    ) AS roles,
    COALESCE(s.accessibility_tier, 'road'),
    ROUND(
      (ST_Distance(
        mt.workstation_geom::geography,
        ST_SetSRID(ST_MakePoint(p_venue_long, p_venue_lat), 4326)::geography
      ) / 1000.0)::NUMERIC
    , 2)::NUMERIC(8,2) AS straight_line_km
  FROM master_trainers mt
  LEFT JOIN schools s ON s.school_code = mt.workstation_school_code
  WHERE  mt.workstation_lat   IS NOT NULL
    AND  mt.workstation_long  IS NOT NULL
    AND  mt.workstation_geom  IS NOT NULL
    AND  ST_DWithin(
           mt.workstation_geom::geography,
           ST_SetSRID(ST_MakePoint(p_venue_long, p_venue_lat), 4326)::geography,
           p_radius_km * 1000
         )
    AND (
      p_item_ids IS NULL
      OR array_length(p_item_ids, 1) IS NULL
      OR EXISTS (
        SELECT 1 FROM trainer_skills ts
        WHERE  ts.trainer_id = mt.trainer_id AND ts.item_id = ANY(p_item_ids)
      )
    )
    AND (
      p_start_date IS NULL OR p_end_date IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM training_engagements te
        WHERE  te.assigned_trainer_id = mt.trainer_id
          AND  te.workflow_status IN ('Confirmed', 'Pending Invite')
          AND  te.start_date <= p_end_date
          AND  te.end_date   >= p_start_date
      )
    )
  ORDER BY straight_line_km ASC;
$$;

GRANT EXECUTE ON FUNCTION public.fn_available_trainers TO authenticated, service_role;
