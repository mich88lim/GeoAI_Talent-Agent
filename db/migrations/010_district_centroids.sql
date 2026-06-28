-- ============================================================
-- Migration 010: fn_all_district_centroids
-- Returns one row per PPD district with the geographic centre
-- computed as the average of all school coordinates in that
-- district. Used to pre-plot the 30 PPD pins on the heatmap.
-- Run in Supabase SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_all_district_centroids()
RETURNS TABLE (ppd_district TEXT, lat FLOAT, lng FLOAT)
LANGUAGE sql STABLE
AS $$
  SELECT
    ppd_district,
    AVG(latitude)::FLOAT  AS lat,
    AVG(longitude)::FLOAT AS lng
  FROM schools
  WHERE ppd_district IS NOT NULL
    AND latitude  IS NOT NULL
    AND longitude IS NOT NULL
  GROUP BY ppd_district
  ORDER BY ppd_district;
$$;

GRANT EXECUTE ON FUNCTION public.fn_all_district_centroids TO authenticated, service_role;
