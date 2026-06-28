'use client'

import { useMapEvents } from 'react-leaflet'

interface DropPinHandlerProps {
  onPin: (lat: number, lng: number) => void
}

export function DropPinHandler({ onPin }: DropPinHandlerProps) {
  useMapEvents({
    click(e) {
      onPin(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}
