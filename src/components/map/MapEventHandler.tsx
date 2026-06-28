'use client'

import { useEffect } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'

interface MapEventHandlerProps {
  onZoomChange: (zoom: number) => void
}

export function MapEventHandler({ onZoomChange }: MapEventHandlerProps) {
  const map = useMap()

  // Report initial zoom on mount
  useEffect(() => {
    onZoomChange(map.getZoom())
  }, [map, onZoomChange])

  useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
  })

  return null
}
