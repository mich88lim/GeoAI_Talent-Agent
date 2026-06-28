'use client'

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

type HeatPoint = [number, number] | [number, number, number]

interface HeatLayerProps {
  points: HeatPoint[]
  radius?: number
  blur?: number
  max?: number
}

const GRADIENT = {
  0.0: '#12B5AC',  // teal — sparse
  0.4: '#1E63C4',  // royal blue
  0.7: '#F2A341',  // amber — dense
  1.0: '#E8502A',  // warm red — peak
}

export function HeatLayer({ points, radius = 25, blur = 20, max = 1.0 }: HeatLayerProps) {
  const map = useMap()
  const layerRef = useRef<L.HeatLayer | null>(null)

  useEffect(() => {
    if (typeof L.heatLayer !== 'function') {
      console.error('[HeatLayer] L.heatLayer is not available — leaflet.heat may not have loaded')
      return
    }
    if (!layerRef.current) {
      layerRef.current = L.heatLayer(points, {
        radius,
        blur,
        max,
        minOpacity: 0.4,
        gradient: GRADIENT,
      })
      layerRef.current.addTo(map)
    } else {
      layerRef.current.setLatLngs(points)
      layerRef.current.redraw()
    }
  }, [map, points, radius, blur, max])

  // Remove layer on unmount
  useEffect(() => {
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [map])

  return null
}
