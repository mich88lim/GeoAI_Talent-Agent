-- ============================================================
-- Migration 009: fn_trainer_pins
-- New function for the drill-down pin view (zoom >= 10).
-- Returns trainer name + school for tooltip display.
-- Does NOT modify fn_trainer_heatmap.
-- Run in Supabase SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_trainer_pins(
  p_item_id     INTEGER DEFAULT NULL,
  p_center_lat  FLOAT   DEFAULT NULL,
  p_center_long FLOAT   DEFAULT NULL,
  p_radius_km   FLOAT   DEFAULT NULL
)
RETURNS TABLE (
  trainer_id   TEXT,
  trainer_name TEXT,
  school_name  TEXT,
  ppd_district TEXT,
  lat          FLOAT,
  lng          FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    mt.trainer_id,
    mt.trainer_name,
    s.school_name,
    mt.ppd_district,
    mt.workstation_lat,
    mt.workstation_long
  FROM master_trainers mt
  LEFT JOIN schools s ON s.school_code = mt.workstation_school_code
  WHERE mt.workstation_lat  IS NOT NULL
    AND mt.workstation_long IS NOT NULL
    AND (
      p_item_id IS NULL
      OR EXISTS (
        SELECT 1 FROM trainer_skills ts
        WHERE ts.trainer_id = mt.trainer_id
          AND ts.item_id    = p_item_id
      )
    )
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

GRANT EXECUTE ON FUNCTION public.fn_trainer_pins TO authenticated, service_role;
