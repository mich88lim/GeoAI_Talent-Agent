'use client'

import { useMap, useMapEvents } from 'react-leaflet'

// Zoom level to fly to when user clicks the heatmap
const FLY_TO_ZOOM = 12

interface DrillDownHandlerProps {
  onDrillDown: (lat: number, lng: number) => void
}

// Renders inside MapContainer — handles heatmap clicks to zoom in and set centre.
export function DrillDownHandler({ onDrillDown }: DrillDownHandlerProps) {
  const map = useMap()

  useMapEvents({
    click(e) {
      onDrillDown(e.latlng.lat, e.latlng.lng)
      map.flyTo(e.latlng, FLY_TO_ZOOM, { animate: true, duration: 0.8 })
    },
  })

  return null
}
