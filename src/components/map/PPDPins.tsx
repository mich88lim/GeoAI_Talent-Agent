'use client'

import { Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'

export interface PPDPoint {
  ppd_district: string
  lat:          number
  lng:          number
}

// Strips generic admin words to get a short readable abbreviation
function abbrev(district: string): string {
  return district
    .replace(/\b(PPD|Pejabat|Pendidikan|Daerah|Bahagian|Division)\b/gi, '')
    .trim()
    .substring(0, 4)
    .toUpperCase()
}

// Icon cache — one DivIcon per distinct district name
const iconCache = new Map<string, L.DivIcon>()

function getPPDIcon(district: string): L.DivIcon {
  if (!iconCache.has(district)) {
    const label = abbrev(district)
    iconCache.set(
      district,
      L.divIcon({
        className:    '',
        iconSize:     [26, 36],
        iconAnchor:   [13, 36],
        tooltipAnchor:[0, -38],
        html: `
          <div style="position:relative;width:26px;height:36px;filter:drop-shadow(0 2px 4px rgba(14,47,87,0.40))">
            <svg width="26" height="36" viewBox="0 0 26 36" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 23 13 23S26 22.75 26 13C26 5.82 20.18 0 13 0z"
                    fill="#1E63C4" stroke="#0E2F57" stroke-width="1.5"/>
              <circle cx="13" cy="12" r="7" fill="white" opacity="0.95"/>
            </svg>
            <div style="
              position:absolute;top:5px;left:0;width:26px;
              text-align:center;font-size:6px;font-weight:800;
              color:#1E63C4;letter-spacing:0.3px;pointer-events:none;
              font-family:'Inter',system-ui,sans-serif;line-height:1.1
            ">${label}</div>
          </div>
        `,
      })
    )
  }
  return iconCache.get(district)!
}

const FLY_TO_ZOOM = 12

interface PPDPinsProps {
  ppds:     PPDPoint[]
  onSelect: (lat: number, lng: number, name: string) => void
}

export function PPDPins({ ppds, onSelect }: PPDPinsProps) {
  const map = useMap()

  return (
    <>
      {ppds.map(p => (
        <Marker
          key={p.ppd_district}
          position={[p.lat, p.lng]}
          icon={getPPDIcon(p.ppd_district)}
          eventHandlers={{
            click() {
              onSelect(p.lat, p.lng, p.ppd_district)
              map.flyTo([p.lat, p.lng], FLY_TO_ZOOM, { animate: true, duration: 0.8 })
            },
          }}
        >
          <Tooltip direction="top" offset={[0, -38]} opacity={0.97}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0E2F57' }}>
              {p.ppd_district}
            </span>
          </Tooltip>
        </Marker>
      ))}
    </>
  )
}
