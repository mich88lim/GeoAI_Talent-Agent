-- ============================================================
-- Migration 012: Phase 4 — Availability-aware trainer search
-- fn_available_trainers: ST_DWithin + date-overlap exclusion.
-- SECURITY DEFINER so:
--   (a) training_engagements conflict check sees ALL users' bookings
--   (b) master_trainers search crosses district boundaries (intended)
-- Run in Supabase SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_available_trainers(
  p_venue_lat    DOUBLE PRECISION,
  p_venue_long   DOUBLE PRECISION,
  p_radius_km    DOUBLE PRECISION DEFAULT 50,
  p_start_date   DATE             DEFAULT NULL,
  p_end_date     DATE             DEFAULT NULL,
  p_item_id      INTEGER          DEFAULT NULL
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
    -- skills array (correlated subquery mirrors fn_trainer_pins pattern)
    ARRAY(
      SELECT ss.name_en
      FROM   trainer_skills ts
      JOIN   skills_subjects ss ON ss.item_id = ts.item_id
      WHERE  ts.trainer_id = mt.trainer_id AND ss.type = 'SKILL'
      ORDER BY ss.name_en
    ) AS skills,
    -- subjects array
    ARRAY(
      SELECT ss.name_en
      FROM   trainer_skills ts
      JOIN   skills_subjects ss ON ss.item_id = ts.item_id
      WHERE  ts.trainer_id = mt.trainer_id AND ss.type = 'SUBJECT'
      ORDER BY ss.name_en
    ) AS subjects,
    -- roles array
    ARRAY(
      SELECT tr.role
      FROM   trainer_roles tr
      WHERE  tr.trainer_id = mt.trainer_id
      ORDER BY tr.role
    ) AS roles,
    -- accessibility tier from trainer's workstation school (default 'road')
    COALESCE(s.accessibility_tier, 'road'),
    -- straight-line distance in km (for initial ranking + boat/flight cost basis)
    ROUND(
      (ST_Distance(
        mt.workstation_geom::geography,
        ST_SetSRID(ST_MakePoint(p_venue_long, p_venue_lat), 4326)::geography
      ) / 1000.0)::NUMERIC
    , 2)::NUMERIC(8,2) AS straight_line_km
  FROM master_trainers mt
  LEFT JOIN schools s ON s.school_code = mt.workstation_school_code
  WHERE
    mt.workstation_lat  IS NOT NULL
    AND mt.workstation_long IS NOT NULL
    AND mt.workstation_geom IS NOT NULL
    -- radius filter
    AND ST_DWithin(
      mt.workstation_geom::geography,
      ST_SetSRID(ST_MakePoint(p_venue_long, p_venue_lat), 4326)::geography,
      p_radius_km * 1000
    )
    -- skill / subject filter
    AND (
      p_item_id IS NULL
      OR EXISTS (
        SELECT 1 FROM trainer_skills ts
        WHERE  ts.trainer_id = mt.trainer_id AND ts.item_id = p_item_id
      )
    )
    -- availability filter: exclude trainers with overlapping Confirmed/Pending Invite engagements
    -- interval overlap: A ∩ B ≠ ∅ ⟺ A.start ≤ B.end AND A.end ≥ B.start
    AND (
      p_start_date IS NULL
      OR p_end_date IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM training_engagements te
        WHERE  te.assigned_trainer_id = mt.trainer_id
          AND  te.workflow_status IN ('Confirmed', 'Pending Invite')
          AND  te.start_date <= p_end_date
          AND  te.end_date   >= p_start_date
      )
    )
  ORDER BY straight_line_km ASC
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.fn_available_trainers TO authenticated, service_role;
