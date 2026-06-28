import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const itemIds   = searchParams.getAll('item_id').map(Number).filter(n => !isNaN(n) && n > 0)
  const centerLat = searchParams.get('center_lat')
  const centerLng = searchParams.get('center_long')
  const radiusKm  = searchParams.get('radius_km')

  const { data, error } = await supabase.rpc('fn_trainer_pins', {
    p_item_ids:    itemIds.length > 0 ? itemIds : null,
    p_center_lat:  centerLat ? parseFloat(centerLat)   : null,
    p_center_long: centerLng ? parseFloat(centerLng)   : null,
    p_radius_km:   radiusKm  ? parseFloat(radiusKm)    : null,
  })

  if (error) {
    console.error('[pins]', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const pins = (data ?? []).map((row: {
    trainer_id:   string
    trainer_name: string
    school_name:  string | null
    ppd_district: string | null
    lat:          number
    lng:          number
    skills:       string[] | null
    subjects:     string[] | null
    roles:        string[] | null
  }) => ({
    trainer_id:   row.trainer_id,
    trainer_name: row.trainer_name,
    school_name:  row.school_name,
    ppd_district: row.ppd_district,
    lat:          row.lat,
    lng:          row.lng,
    skills:       row.skills   ?? [],
    subjects:     row.subjects ?? [],
    roles:        row.roles    ?? [],
  }))

  return NextResponse.json({ pins })
}
