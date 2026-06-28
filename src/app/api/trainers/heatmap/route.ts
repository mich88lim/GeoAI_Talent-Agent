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

  const { data, error } = await supabase.rpc('fn_trainer_heatmap', {
    p_item_ids:    itemIds.length > 0 ? itemIds : null,
    p_center_lat:  centerLat ? parseFloat(centerLat)   : null,
    p_center_long: centerLng ? parseFloat(centerLng)   : null,
    p_radius_km:   radiusKm  ? parseFloat(radiusKm)    : null,
  })

  if (error) {
    console.error('[heatmap]', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const points: [number, number][] = (data ?? []).map(
    (row: { lat: number; lng: number }) => [row.lat, row.lng]
  )

  return NextResponse.json({ points })
}
