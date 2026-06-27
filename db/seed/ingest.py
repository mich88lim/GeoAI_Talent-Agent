#!/usr/bin/env python3
"""
Phase 1 data ingestion — GEO-TALENT AGENT
Reads MASTER_LIST_V2_GeoAI_CLEANED_1.xlsx and loads:
  1. schools           (1 460 rows)
  2. skills_subjects   (35 unique skills/subjects)
  3. master_trainers   (994 trainers)
  4. trainer_skills    (1 551 bridge links)

Geometry (geom / workstation_geom) is auto-populated by DB triggers
from the longitude/latitude columns — no WKT needed here.

Run from the geo-talent-agent/ project root:
  Windows:  .venv/Scripts/activate && python db/seed/ingest.py
  macOS:    source .venv/bin/activate && python db/seed/ingest.py

Requires in .env.local (or .env):
  NEXT_PUBLIC_SUPABASE_URL   — your project URL
  SUPABASE_SERVICE_KEY       — service_role key (bypasses RLS for bulk load)
"""

import os
import sys
from pathlib import Path

import openpyxl
from dotenv import load_dotenv
from supabase import create_client, Client

# ── Locate and load env ────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent.parent  # …/geo-talent-agent/../../ → project root
# Try geo-talent-agent/.env.local first (Next.js), fall back to .env
for name in ['.env.local', '.env']:
    p = Path(__file__).resolve().parent.parent.parent / name  # geo-talent-agent/
    if p.exists():
        load_dotenv(p, override=True)
        break

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL', '').strip()
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '').strip()

if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit(
        'ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in '
        'geo-talent-agent/.env.local before running this script.'
    )

# ── Locate XLSX ────────────────────────────────────────────────────────────────
# The file sits one level above geo-talent-agent/ (gitignored there)
XLSX_CANDIDATES = [
    Path(__file__).resolve().parent.parent.parent.parent / 'MASTER_LIST_V2_GeoAI_CLEANED_1.xlsx',
    Path(__file__).resolve().parent.parent.parent.parent / 'MASTER_LIST_V2_GeoAI_CLEANED.xlsx',
]
XLSX_PATH = next((p for p in XLSX_CANDIDATES if p.exists()), None)
if XLSX_PATH is None:
    sys.exit(
        'ERROR: Cannot find MASTER_LIST_V2_GeoAI_CLEANED_1.xlsx. '
        'Place it in the parent folder of geo-talent-agent/ and re-run.'
    )


# ── Helpers ────────────────────────────────────────────────────────────────────
def load_sheet(wb: openpyxl.Workbook, name: str, header_row: int = 3) -> list[dict]:
    """Return sheet rows as dicts, using row `header_row` as column names."""
    ws = wb[name]
    all_rows = list(ws.iter_rows(values_only=True))
    headers = [
        str(h).strip() if h is not None else f'_col{i}'
        for i, h in enumerate(all_rows[header_row - 1])
    ]
    result = []
    for row in all_rows[header_row:]:
        if any(v is not None for v in row):
            result.append(dict(zip(headers, row)))
    return result


def chunked(lst: list, n: int):
    for i in range(0, len(lst), n):
        yield lst[i : i + n]


def upsert(client: Client, table: str, rows: list[dict], conflict: str, chunk_size: int = 200):
    """Upsert rows in chunks; return total inserted."""
    for chunk in chunked(rows, chunk_size):
        client.table(table).upsert(chunk, on_conflict=conflict).execute()
    return len(rows)


# ── Main ingestion ─────────────────────────────────────────────────────────────
def main():
    print(f'GEO-TALENT AGENT — Phase 1 ingestion')
    print(f'  Source: {XLSX_PATH.name}')
    print(f'  Target: {SUPABASE_URL}\n')

    client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    wb = openpyxl.load_workbook(XLSX_PATH, read_only=True, data_only=True)

    # ── 1. Schools ────────────────────────────────────────────────────────────
    print('[1/4] Loading schools...')
    schools_raw = load_sheet(wb, 'schools')
    schools = []
    skipped_schools = 0
    for r in schools_raw:
        code = r.get('school_code')
        name = r.get('school_name')
        if not code or not name:
            skipped_schools += 1
            continue
        lon = r.get('long')
        lat = r.get('lat')
        schools.append({
            'school_code':   str(code).strip(),
            'school_name':   str(name).strip(),
            'state':         str(r['state']).strip()        if r.get('state')        else None,
            'ppd_district':  str(r['ppd_district']).strip() if r.get('ppd_district') else None,
            'level':         str(r['level']).strip()        if r.get('level')        else None,
            'school_type':   str(r['school_type']).strip()  if r.get('school_type')  else None,
            'address':       str(r['address']).strip()      if r.get('address')      else None,
            'postcode':      str(r['postcode']).strip()     if r.get('postcode')     else None,
            'city':          str(r['city']).strip()         if r.get('city')         else None,
            'longitude':     float(lon)                     if lon is not None       else None,
            'latitude':      float(lat)                     if lat is not None       else None,
            # geom is populated by the DB trigger from longitude/latitude
        })
    total = upsert(client, 'schools', schools, 'school_code')
    print(f'  ✓ {total} schools loaded  ({skipped_schools} skipped — missing code/name)')

    # ── 2. Skills/subjects taxonomy ──────────────────────────────────────────
    print('\n[2/4] Loading skills_subjects...')
    ss_raw = load_sheet(wb, 'skills_subjects_reference')
    ss_rows = []
    for r in ss_raw:
        type_val = str(r.get('type', '')).strip().upper()
        name_en  = str(r.get('name_en', '')).strip()
        name_bm  = str(r.get('name_bm', '')).strip()
        if not type_val or not name_en:
            continue
        ss_rows.append({
            'type':               type_val,
            'name_en':            name_en,
            'name_bm':            name_bm or name_en,
            'category_en':        str(r['category_en']).strip()       if r.get('category_en')       else None,
            'category_bm':        str(r['category_bm']).strip()       if r.get('category_bm')       else None,
            'ict_specialisation': str(r['ict_specialisation']).strip() if r.get('ict_specialisation') else None,
        })
    upsert(client, 'skills_subjects', ss_rows, 'type,name_en')

    # Fetch back with assigned item_ids for the bridge step
    result = client.table('skills_subjects').select('item_id, type, name_en').execute()
    ss_lookup: dict[tuple, int] = {
        (row['type'], row['name_en']): row['item_id']
        for row in result.data
    }
    print(f'  ✓ {len(ss_rows)} skills/subjects loaded  (lookup table has {len(ss_lookup)} entries)')

    # ── 3. Master trainers ────────────────────────────────────────────────────
    print('\n[3/4] Loading master_trainers...')
    mt_raw = load_sheet(wb, 'master_trainers')
    trainers = []
    skipped_trainers = 0
    for r in mt_raw:
        tid  = r.get('trainer_id')
        name = r.get('trainer_name')
        if not tid or not name:
            skipped_trainers += 1
            continue
        lon = r.get('workstation_long')
        lat = r.get('workstation_lat')
        sc  = r.get('workstation_school_code')
        trainers.append({
            'trainer_id':              str(tid).strip(),
            'trainer_name':            str(name).strip(),
            'email':                   str(r['email']).strip()       if r.get('email')       else None,
            'ppd_district':            str(r['ppd_district']).strip() if r.get('ppd_district') else None,
            'workstation_school_code': str(sc).strip()               if sc                    else None,
            'workstation_long':        float(lon)                    if lon is not None       else None,
            'workstation_lat':         float(lat)                    if lat is not None       else None,
            # workstation_geom populated by DB trigger
            'level':                   str(r['level']).strip()       if r.get('level')        else None,
            'coord_source':            str(r['coord_source']).strip() if r.get('coord_source') else None,
        })
    total = upsert(client, 'master_trainers', trainers, 'trainer_id')
    print(f'  ✓ {total} trainers loaded  ({skipped_trainers} skipped — missing id/name)')

    # ── 4. Trainer-skills bridge ──────────────────────────────────────────────
    print('\n[4/4] Loading trainer_skills bridge...')
    ts_raw = load_sheet(wb, 'trainer_skills')
    bridges: list[dict] = []
    no_match = 0
    seen: set[tuple] = set()

    for r in ts_raw:
        tid     = r.get('trainer_id')
        type_v  = str(r.get('type', '')).strip().upper()
        name_en = str(r.get('name_en', '')).strip()
        if not tid or not type_v or not name_en:
            no_match += 1
            continue
        item_id = ss_lookup.get((type_v, name_en))
        if item_id is None:
            no_match += 1
            continue
        key = (str(tid).strip(), item_id)
        if key in seen:
            continue
        seen.add(key)
        bridges.append({'trainer_id': str(tid).strip(), 'item_id': item_id})

    total = upsert(client, 'trainer_skills', bridges, 'trainer_id,item_id')
    print(f'  ✓ {total} trainer-skill links loaded  ({no_match} skipped — no matching item or missing fields)')

    wb.close()

    # ── Summary ───────────────────────────────────────────────────────────────
    print()
    print('=' * 56)
    print('INGESTION COMPLETE')
    print(f'  Schools:           {len(schools):>5}')
    print(f'  Skills/subjects:   {len(ss_rows):>5}')
    print(f'  Trainers:          {len(trainers):>5}')
    print(f'  Trainer-skill links:{len(bridges):>4}')
    print('=' * 56)
    print()
    print('Next steps:')
    print('  • Verify row counts in Supabase Table Editor')
    print('  • Check that schools.geom and master_trainers.workstation_geom')
    print('    are populated (Table Editor → geom column should not be NULL)')
    print('  • Review review_needed sheet for same-name trainer duplicates')


if __name__ == '__main__':
    main()
