-- ============================================================
-- Migration 013: Backfill workstation_geom for trainers and
-- schools geom where coordinates exist but geometry is NULL.
--
-- Safe to re-run: WHERE workstation_geom IS NULL ensures
-- existing geometry is never overwritten.
-- ============================================================

-- Trainers
UPDATE master_trainers
SET workstation_geom = ST_SetSRID(
      ST_MakePoint(workstation_long, workstation_lat), 4326)
WHERE workstation_long IS NOT NULL
  AND workstation_lat  IS NOT NULL
  AND workstation_geom IS NULL;

-- Schools (same safety net in case school geom is also missing)
UPDATE schools
SET geom = ST_SetSRID(
      ST_MakePoint(longitude, latitude), 4326)
WHERE longitude IS NOT NULL
  AND latitude  IS NOT NULL
  AND geom IS NULL;

-- ── Verification ──────────────────────────────────────────
-- Run these selects after the UPDATE to confirm backfill:
--
--   SELECT COUNT(*) total, COUNT(workstation_geom) with_geom
--   FROM master_trainers
--   WHERE workstation_lat IS NOT NULL;
--
--   SELECT COUNT(*) total, COUNT(geom) with_geom
--   FROM schools
--   WHERE latitude IS NOT NULL;
--
-- with_geom should equal total in both cases.
