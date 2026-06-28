import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SearchRequestBody {
  target_item_ids?: number[]
  venue_lat:        number
  venue_long:       number
  venue_text?:      string
  radius_km?:       number
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: SearchRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { target_item_ids, venue_lat, venue_long, radius_km = 50 } = body

  if (typeof venue_lat !== 'number' || typeof venue_long !== 'number') {
    return NextResponse.json(
      { error: 'venue_lat and venue_long are required numbers' },
      { status: 400 }
    )
  }

  const clampedRadius = Math.max(1, Math.min(500, radius_km))

  const { data, error } = await supabase.rpc('fn_trainer_pins', {
    p_item_ids:    (target_item_ids?.length ?? 0) > 0 ? target_item_ids : null,
    p_center_lat:  venue_lat,
    p_center_long: venue_long,
    p_radius_km:   clampedRadius,
  })

  if (error) {
    console.error('[engagements/search]', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const trainers = (data ?? []).map((row: {
    trainer_id:   string
    trainer_name: string
    school_name:  string | null
    ppd_district: string | null
    lat:          number
    lng:          number
    skills:       string[] | null
    subjects:     string[] | null
    roles:        string[] | null
  }) => {
    // Straight-line road cost estimate — labelled 'estimate' so the UI shows a caveat badge.
    // Rate matches computeLandCost: RM1.00/km (≤500 km one-way) or RM0.90/km (>500 km).
    const distKm  = Math.round(haversineKm(venue_lat, venue_long, row.lat, row.lng) * 10) / 10
    const rate    = distKm <= 500 ? 1.00 : 0.90
    const costMyr = Math.round(distKm * 2 * rate * 100) / 100

    // Sarawak domestic flight estimate: RM400 base + RM0.90/km (straight-line, round-trip indicative)
    const travelOptions: Array<{
      mode: 'Road' | 'Boat' | 'Flight'
      distance_km: number; duration_min: number
      cost_myr: number; cost_source: string; cost_note: string
    }> = [{
      mode: 'Road', distance_km: distKm, duration_min: 0,
      cost_myr: costMyr, cost_source: 'estimate',
      cost_note: 'Straight-line estimate; road distance and mode may differ',
    }]

    if (distKm > 250) {
      const flightCost = Math.round((400 + distKm * 0.9) * 100) / 100
      travelOptions.push({
        mode: 'Flight',
        distance_km: distKm,
        duration_min: Math.round((distKm / 600) * 60) + 60,
        cost_myr: flightCost,
        cost_source: 'estimate',
        cost_note: 'Formula estimate: RM400 base + RM0.90/km (Sarawak domestic, indicative only)',
      })
    }

    return {
      trainer_id:     row.trainer_id,
      trainer_name:   row.trainer_name,
      school_name:    row.school_name,
      ppd_district:   row.ppd_district,
      lat:            row.lat,
      lng:            row.lng,
      skills:         row.skills   ?? [],
      subjects:       row.subjects ?? [],
      roles:          row.roles    ?? [],
      distance_km:    distKm,
      duration_min:   0,
      transport_mode: 'Road' as const,
      cost_myr:       costMyr,
      cost_source:    'estimate',
      cost_note:      'Straight-line estimate; road distance and mode may differ',
      travel_options: travelOptions,
    }
  })

  return NextResponse.json({ trainers, count: trainers.length })
}
