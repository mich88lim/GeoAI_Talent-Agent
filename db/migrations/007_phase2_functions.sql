-- ============================================================
-- Migration 007: Phase 2 — Heatmap & district-centroid RPCs
-- Run in Supabase SQL Editor.
-- ============================================================

-- fn_trainer_heatmap ─────────────────────────────────────────
-- Returns (lat, lng) pairs for the heatmap layer.
-- SECURITY INVOKER (default): RLS on master_trainers applies,
-- so district users see only their district automatically.
CREATE OR REPLACE FUNCTION public.fn_trainer_heatmap(
  p_item_id     INTEGER DEFAULT NULL,
  p_center_lat  FLOAT   DEFAULT NULL,
  p_center_long FLOAT   DEFAULT NULL,
  p_radius_km   FLOAT   DEFAULT NULL
)
RETURNS TABLE (lat FLOAT, lng FLOAT)
LANGUAGE sql STABLE
AS $$
  SELECT
    mt.workstation_lat,
    mt.workstation_long
  FROM master_trainers mt
  WHERE mt.workstation_lat  IS NOT NULL
    AND mt.workstation_long IS NOT NULL
    -- skill / subject filter
    AND (
      p_item_id IS NULL
      OR EXISTS (
        SELECT 1 FROM trainer_skills ts
        WHERE ts.trainer_id = mt.trainer_id
          AND ts.item_id    = p_item_id
      )
    )
    -- spatial radius filter (only when all three params supplied)
    AND (
      p_center_lat  IS NULL
      OR p_center_long IS NULL
      OR p_radius_km   IS NULL
      OR ST_DWithin(
           mt.workstation_geom::geography,
           ST_SetSRID(ST_MakePoint(p_center_long, p_center_lat), 4326)::geography,
           p_radius_km * 1000
         )
    );
$$;

-- fn_district_centroid ───────────────────────────────────────
-- Returns the geographic centre of a PPD district, computed
-- as the average of all school coordinates in that district.
CREATE OR REPLACE FUNCTION public.fn_district_centroid(p_district TEXT)
RETURNS TABLE (lat FLOAT, lng FLOAT)
LANGUAGE sql STABLE
AS $$
  SELECT
    AVG(s.latitude)::FLOAT  AS lat,
    AVG(s.longitude)::FLOAT AS lng
  FROM schools s
  WHERE s.ppd_district = p_district
    AND s.latitude  IS NOT NULL
    AND s.longitude IS NOT NULL;
$$;

-- Grants ─────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.fn_trainer_heatmap   TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_district_centroid TO authenticated, service_role;
